// Hi Fly ACMI Contract Generator — Word-template merge → PDF (LibreOffice)
const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const FETCH_URL = "https://trnsf.up.railway.app/webhook/hifly-contract-fetch";
const TEMPLATE_DOCX = path.join(__dirname, 'contract_template.docx');

app.use(express.static(__dirname));

// XML-escape a merge value (values go into word/document.xml)
function xmlEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

// Build a merged .docx by unzipping the template, replacing {{tokens}} in document.xml, re-zipping.
function buildDocx(fields, workDir){
  return new Promise((resolve, reject)=>{
    const unz = path.join(workDir,'x');
    fs.mkdirSync(unz,{recursive:true});
    execFile('unzip',['-qo',TEMPLATE_DOCX,'-d',unz],(e1)=>{
      if(e1) return reject(e1);
      const xmlPath = path.join(unz,'word','document.xml');
      let xml = fs.readFileSync(xmlPath,'utf8');
      xml = xml.replace(/\{\{(\w+)\}\}/g,(m,k)=>{
        const v = fields[k];
        return (v!==undefined && v!==null && v!=='') ? xmlEsc(v) : '_________';
      });
      fs.writeFileSync(xmlPath,xml);
      const outDocx = path.join(workDir,'merged.docx');
      execFile('bash',['-c',`cd "${unz}" && zip -Xrq "${outDocx}" .`],(e2)=>{
        if(e2) return reject(e2);
        resolve(outDocx);
      });
    });
  });
}

// Convert a .docx to .pdf via LibreOffice headless
function docxToPdf(docxPath, workDir){
  return new Promise((resolve, reject)=>{
    execFile('soffice',['--headless','--convert-to','pdf','--outdir',workDir,docxPath],
      {timeout:120000, env:{...process.env, HOME:workDir}},(err)=>{
        if(err) return reject(err);
        const pdf = docxPath.replace(/\.docx$/,'.pdf');
        if(fs.existsSync(pdf)) return resolve(pdf);
        reject(new Error('pdf not produced'));
      });
  });
}

app.get('/api/pdf', async (req,res)=>{
  const dealId = (req.query.deal_id||'').toString();
  if(!dealId) return res.status(400).json({error:'deal_id required'});
  const work = fs.mkdtempSync(path.join(os.tmpdir(),'hf-'));
  try{
    const r = await fetch(FETCH_URL+'?deal_id='+encodeURIComponent(dealId));
    const data = await r.json();
    const fields = data.fields || {};
    if(fields.min_month_total===undefined) fields.min_month_total='';
    const docx = await buildDocx(fields, work);
    const pdf = await docxToPdf(docx, work);
    const buf = fs.readFileSync(pdf);
    const safe = (fields.agreement_no||'contract').replace(/[^A-Za-z0-9._-]+/g,'_');
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline; filename="ACMI_'+safe+'.pdf"');
    res.setHeader('Access-Control-Allow-Origin','*');
    res.send(buf);
  }catch(e){
    console.error(e);
    res.status(500).json({error:'pdf render failed',detail:String(e)});
  }finally{
    try{ fs.rmSync(work,{recursive:true,force:true}); }catch(_){}
  }
});

app.get('/healthz',(_,res)=>res.json({status:'ok'}));
app.listen(PORT, ()=>console.log('hf-contract-gen (docx) on '+PORT));
