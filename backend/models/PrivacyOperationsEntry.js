const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 type:{type:String,enum:["inventory","retention","consent","evidence"],required:true,index:true},
 title:{type:String,required:true,trim:true,maxlength:180},description:{type:String,default:"",maxlength:4000},
 purpose:{type:String,default:"",maxlength:1500},dataCategories:{type:String,default:"",maxlength:1500},
 storageLocation:{type:String,default:"",maxlength:500},recipients:{type:String,default:"",maxlength:1000},
 retentionDays:{type:Number,default:null,min:1,max:36500},reviewDate:{type:Date,default:null},
 status:{type:String,enum:["active","under_review","expired","withdrawn","archived"],default:"active",index:true},
 policyVersion:{type:String,default:"",maxlength:80},consentChannel:{type:String,default:"",maxlength:100},
 evidenceUrl:{type:String,default:"",maxlength:1500},legalHold:{type:Boolean,default:false},
 notes:{type:String,default:"",maxlength:3000},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 auditHistory:[{action:String,actor:{type:mongoose.Schema.Types.ObjectId,ref:"User"},occurredAt:{type:Date,default:Date.now},note:String}]
},{timestamps:true});
schema.index({type:1,status:1,reviewDate:1});
module.exports=mongoose.model("PrivacyOperationsEntry",schema);