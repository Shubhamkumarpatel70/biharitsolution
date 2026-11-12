const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;
const Media = require("../models/Media");
const AuditLog = require("../models/AuditLog");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req,file,cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Only JPG, PNG, WEBP, GIF and PDF files are allowed."));
    cb(null,true);
  }
});
router.use((req,res,next)=>{
  const header=req.headers.authorization;
  if(!header || !header.startsWith("Bearer ")) return res.status(401).json({message:"Authentication required."});
  try {
    req.user=jwt.verify(header.split(" ")[1],process.env.JWT_SECRET || "changeme");
    if(!["admin","coadmin"].includes(req.user.role)) return res.status(403).json({message:"Admin access required."});
    next();
  } catch(error){return res.status(401).json({message:"Session expired. Please sign in again."});}
});
function configureCloudinary(){
  const {CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET}=process.env;
  if(!CLOUDINARY_CLOUD_NAME||!CLOUDINARY_API_KEY||!CLOUDINARY_API_SECRET) throw new Error("Cloudinary is not configured.");
  cloudinary.config({cloud_name:CLOUDINARY_CLOUD_NAME,api_key:CLOUDINARY_API_KEY,api_secret:CLOUDINARY_API_SECRET,secure:true});
}
router.get("/",async(req,res)=>{
  try{const items=await Media.find().sort({createdAt:-1}).limit(200).lean();res.json({items});}
  catch(error){res.status(500).json({message:"Unable to load media library."});}
});
router.post("/",(req,res,next)=>{try{configureCloudinary();next();}catch(error){res.status(503).json({message:error.message});}},upload.single("file"),async(req,res)=>{
  try{
    if(!req.file)return res.status(400).json({message:"Choose a file to upload."});
    const result=await new Promise((resolve,reject)=>{
      const stream=cloudinary.uploader.upload_stream({folder:"askc-technologies",resource_type:"auto",use_filename:false,unique_filename:true},(error,uploaded)=>error?reject(error):resolve(uploaded));
      Readable.from(req.file.buffer).pipe(stream);
    });
    const item=await Media.create({originalName:req.file.originalname,secureUrl:result.secure_url,publicId:result.public_id,resourceType:result.resource_type,mimeType:req.file.mimetype,size:req.file.size,altText:String(req.body.altText||"").slice(0,250),uploadedBy:req.user.id});
    AuditLog.create({actor:req.user.id,action:"upload",entityType:"media",entityId:String(item._id),summary:"Uploaded media: "+item.originalName}).catch(error=>console.error("Media audit log failed:",error.message));
    res.status(201).json({item,message:"File uploaded."});
  }catch(error){console.error("Media upload failed:",error.message);res.status(500).json({message:"Upload failed. Check Cloudinary configuration and try again."});}
});
router.delete("/:id",async(req,res)=>{
  try{
    const item=await Media.findById(req.params.id);
    if(!item)return res.status(404).json({message:"Media record not found."});
    configureCloudinary();
    await cloudinary.uploader.destroy(item.publicId,{resource_type:item.resourceType});
    await item.deleteOne();
    AuditLog.create({actor:req.user.id,action:"delete",entityType:"media",entityId:String(item._id),summary:"Deleted media: "+item.originalName}).catch(error=>console.error("Media audit log failed:",error.message));
    res.json({message:"Media deleted."});
  }catch(error){res.status(500).json({message:"Unable to delete media."});}
});
router.use((error,req,res,next)=>{
  if(error instanceof multer.MulterError)return res.status(400).json({message:error.code==="LIMIT_FILE_SIZE"?"File must be 8 MB or smaller.":"Upload limit exceeded."});
  if(error)return res.status(400).json({message:error.message||"Invalid upload."});
  next();
});
module.exports=router;