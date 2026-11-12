import React,{useCallback,useEffect,useMemo,useState} from "react";
import axios from "../axios";

const TYPES=[["page","Pages"],["service","Services"],["product","Products"],["portfolio","Portfolio"],["industry","Industries"],["article","Blog / Insights"],["career","Careers"],["testimonial","Testimonials"],["site-setting","Site settings"]];
const blank=()=>({title:"",slug:"",summary:"",body:"",category:"",tags:"",imageUrl:"",imageAlt:"",status:"draft",sortOrder:0,seo:{title:"",description:""}});
export default function AdminCMS(){
 const [type,setType]=useState("page"),[items,setItems]=useState([]),[media,setMedia]=useState([]),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);setNotice("");
  try{
   const [contentResult,mediaResult]=await Promise.all([axios.get("/api/cms/"+type),axios.get("/api/media")]);
   setItems(contentResult.data.items||[]);setMedia(mediaResult.data.items||[]);
  }catch(error){setNotice(error.response?.data?.message||"Could not load CMS records or media assets.");}
  finally{setLoading(false);}
 },[type]);
 useEffect(()=>{load();},[load]);
 const change=(key,value)=>setForm(old=>({...old,[key]:value}));
 const beginEdit=item=>{
  setEditing(item._id);
  setForm({title:item.title||"",slug:item.slug||"",summary:item.summary||"",body:item.body||"",category:item.category||"",tags:(item.tags||[]).join(", "),imageUrl:item.imageUrl||"",imageAlt:item.imageAlt||"",status:item.status||"draft",sortOrder:item.sortOrder??0,seo:item.seo||{title:"",description:""}});
  window.scrollTo({top:0,behavior:"smooth"});
 };
 const reset=()=>{setEditing(null);setForm(blank());};
 const save=async event=>{
  event.preventDefault();setSaving(true);setNotice("");
  const payload={...form,type,tags:form.tags.split(",").map(tag=>tag.trim()).filter(Boolean)};
  try{
   if(editing)await axios.put("/api/cms/"+editing,payload);else await axios.post("/api/cms",payload);
   setNotice(editing?"Content updated successfully.":"Content created successfully.");reset();await load();
  }catch(error){setNotice(error.response?.data?.message||"Save failed. Please try again.");}
  finally{setSaving(false);}
 };
 const archive=async id=>{
  if(!window.confirm("Archive this record? It will be hidden from public pages but retained in the database."))return;
  try{await axios.delete("/api/cms/"+id);setNotice("Content archived.");await load();}
  catch(error){setNotice(error.response?.data?.message||"Archive failed.");}
 };
 return <div className="p-4 md:p-7 max-w-7xl mx-auto w-full">
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6"><div><p className="text-xs font-bold tracking-[.18em] text-blue-600 mb-2">ASKC TECHNOLOGIES / WEBSITE</p><h2 className="text-2xl md:text-3xl font-bold text-slate-900">Website CMS</h2><p className="text-sm text-slate-500 mt-1">Manage website content and choose images from the media library.</p></div><button type="button" onClick={load} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">Refresh records</button></div>
  {notice&&<div role="status" className="rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm p-3 mb-4">{notice}</div>}
  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)] gap-5">
   <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-bold text-slate-900">Content library</h3><span className="text-xs text-slate-500">{items.length} records</span></div>
    <label className="block text-xs font-semibold text-slate-600 mb-2">Content type</label>
    <select value={type} onChange={event=>{setType(event.target.value);reset();}} className="w-full border border-slate-200 rounded-xl px-3 py-3 mb-4 bg-white">{TYPES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>
    {loading?<p className="text-sm text-slate-500 py-8 text-center">Loading records…</p>:items.length===0?<div className="text-center py-10 border border-dashed border-slate-200 rounded-xl"><p className="font-semibold text-slate-700">No records yet</p><p className="text-xs text-slate-500 mt-1">Create your first {type} entry using the editor.</p></div>:<div className="space-y-2">{items.map(item=><article key={item._id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl p-3"><div className="min-w-0"><p className="font-semibold text-sm text-slate-800 truncate">{item.title}</p><p className="text-xs text-slate-500 truncate">/{item.slug} · {item.status}</p></div><div className="flex gap-2 shrink-0"><button type="button" onClick={()=>beginEdit(item)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-50 text-blue-700">Edit</button><button type="button" onClick={()=>archive(item._id)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-600">Archive</button></div></article>)}</div>}
   </section>
   <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
    <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-900">{editing?"Edit content":"Create content"}</h3>{editing&&<button type="button" onClick={reset} className="text-xs text-slate-500 underline">Cancel edit</button>}</div>
    <form onSubmit={save} className="space-y-3">
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label><input required maxLength="180" value={form.title} onChange={event=>change("title",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="Content title"/></div>
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">URL slug *</label><input required value={form.slug} onChange={event=>change("slug",event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,"-"))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="example-page"/></div>
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">Short summary</label><textarea rows="2" maxLength="500" value={form.summary} onChange={event=>change("summary",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"/></div>
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">Content</label><textarea rows="7" value={form.body} onChange={event=>change("body",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="Write the approved website content here."/></div>
     <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-slate-600 mb-1">Category</label><input maxLength="80" value={form.category} onChange={event=>change("category",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="e.g. Web Development"/></div><div><label className="block text-xs font-semibold text-slate-600 mb-1">Tags (comma separated)</label><input value={form.tags} onChange={event=>change("tags",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="React, Business"/></div></div>
     <div className="rounded-xl border border-slate-200 p-3 space-y-2"><div className="flex items-center justify-between"><label className="text-xs font-semibold text-slate-700">Featured image</label><span className="text-[11px] text-slate-500">{media.length} media assets</span></div><select value={form.imageUrl} onChange={event=>{const selected=media.find(asset=>asset.secureUrl===event.target.value);setForm(old=>({...old,imageUrl:event.target.value,imageAlt:selected?.altText||old.imageAlt}));}} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"><option value="">No featured image</option>{media.filter(asset=>asset.mimeType?.startsWith("image/")).map(asset=><option key={asset._id} value={asset.secureUrl}>{asset.originalName}</option>)}</select>{form.imageUrl&&<img src={form.imageUrl} alt={form.imageAlt||"Selected featured image"} className="w-full max-h-44 object-cover rounded-lg"/>}<input value={form.imageAlt} onChange={event=>change("imageAlt",event.target.value)} maxLength="250" className="w-full border border-slate-200 rounded-xl px-3 py-2.5" placeholder="Image alt text for accessibility"/>{media.length===0&&<p className="text-xs text-amber-700">Upload images in the Media Library first, then return here.</p>}</div>
     <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-slate-600 mb-1">Publish status</label><select value={form.status} onChange={event=>change("status",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div><div><label className="block text-xs font-semibold text-slate-600 mb-1">Display order</label><input type="number" value={form.sortOrder} onChange={event=>change("sortOrder",event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"/></div></div>
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">SEO title</label><input value={form.seo.title} onChange={event=>change("seo",{...form.seo,title:event.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"/></div>
     <div><label className="block text-xs font-semibold text-slate-600 mb-1">SEO description</label><textarea rows="2" value={form.seo.description} onChange={event=>change("seo",{...form.seo,description:event.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"/></div>
     <button disabled={saving} className="w-full rounded-xl bg-blue-600 text-white font-bold py-3 disabled:opacity-60">{saving?"Saving…":editing?"Save changes":"Create content"}</button>
    </form>
   </section>
  </div>
 </div>;
}