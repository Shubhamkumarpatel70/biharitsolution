const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const SiteContent = require("../models/SiteContent");
const AuditLog = require("../models/AuditLog");
const router = express.Router();
const TYPES = ["page","service","product","portfolio","industry","article","career","testimonial","site-setting"];
router.use((req,res,next)=>{
  if(req.path.startsWith("/public/")) return next();
  const header=req.headers.authorization;
  if(!header || !header.startsWith("Bearer ")) return res.status(401).json({message:"Authentication required."});
  try { req.user=jwt.verify(header.split(" ")[1],process.env.JWT_SECRET || "changeme"); next(); }
  catch(error){ return res.status(401).json({message:"Session expired. Please sign in again."}); }
});
function requireAdmin(req,res,next){
  if (!req.user || !["admin","coadmin"].includes(req.user.role)) return res.status(403).json({message:"Admin access required."});
  next();
}
function cleanPayload(body){
  return {
    type: body.type, title: String(body.title || "").trim(), slug: String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,""),
    summary: String(body.summary || "").trim(), body: String(body.body || ""),
    status: ["draft","published","archived"].includes(body.status) ? body.status : "draft",
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    seo: { title: String(body.seo?.title || "").trim(), description: String(body.seo?.description || "").trim() }
  };
}
router.get("/public/:type", async (req,res)=>{
  try {
    if (!TYPES.includes(req.params.type)) return res.status(400).json({message:"Invalid content type."});
    const items = await SiteContent.find({type:req.params.type,status:"published"}).sort({sortOrder:1,updatedAt:-1}).select("-createdBy -updatedBy").lean();
    res.json({items});
  } catch(error){res.status(500).json({message:"Unable to load content."});}
});
router.get("/audit-logs", requireAdmin, async (req,res)=>{
  try { const logs=await AuditLog.find().sort({createdAt:-1}).limit(100).populate("actor","name email").lean(); res.json({logs}); }
  catch(error){ res.status(500).json({message:"Unable to load audit logs."}); }
});
router.get("/:type", requireAdmin, async (req,res)=>{
  try {
    if (!TYPES.includes(req.params.type)) return res.status(400).json({message:"Invalid content type."});
    const items = await SiteContent.find({type:req.params.type}).sort({sortOrder:1,updatedAt:-1}).lean();
    res.json({items});
  } catch(error){res.status(500).json({message:"Unable to load CMS records."});}
});
router.post("/", requireAdmin, async (req,res)=>{
  try {
    const data=cleanPayload(req.body);
    if(!TYPES.includes(data.type) || !data.title || !data.slug) return res.status(400).json({message:"Type, title and slug are required."});
    const item=await SiteContent.create({...data,createdBy:req.user.id,updatedBy:req.user.id});
    AuditLog.create({actor:req.user.id,action:"create",entityType:data.type,entityId:String(item._id),summary:"Created "+data.type+": "+data.title}).catch(error=>console.error("CMS audit log failed:",error.message));
    res.status(201).json({item,message:"Content created."});
  } catch(error){res.status(error.code===11000?409:400).json({message:error.code===11000?"This slug already exists for the selected content type.":"Unable to create content. Check the fields and try again."});}
});
router.put("/:id", requireAdmin, async (req,res)=>{
  try {
    if(!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid content ID."});
    const data=cleanPayload(req.body);
    if(!TYPES.includes(data.type) || !data.title || !data.slug) return res.status(400).json({message:"Type, title and slug are required."});
    const item=await SiteContent.findByIdAndUpdate(req.params.id,{...data,updatedBy:req.user.id},{new:true,runValidators:true});
    if(!item) return res.status(404).json({message:"Content not found."});
    AuditLog.create({actor:req.user.id,action:"update",entityType:data.type,entityId:String(item._id),summary:"Updated "+data.type+": "+data.title}).catch(error=>console.error("CMS audit log failed:",error.message));
    res.json({item,message:"Content updated."});
  } catch(error){res.status(error.code===11000?409:400).json({message:error.code===11000?"This slug already exists for the selected content type.":"Unable to update content."});}
});
router.delete("/:id", requireAdmin, async (req,res)=>{
  try {
    if(!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid content ID."});
    const item=await SiteContent.findByIdAndUpdate(req.params.id,{status:"archived",updatedBy:req.user.id},{new:true});
    if(!item) return res.status(404).json({message:"Content not found."});
    AuditLog.create({actor:req.user.id,action:"archive",entityType:item.type,entityId:String(item._id),summary:"Archived "+item.type+": "+item.title}).catch(error=>console.error("CMS audit log failed:",error.message));
    res.json({message:"Content archived. The record is retained."});
  } catch(error){res.status(500).json({message:"Unable to archive content."});}
});
module.exports=router;