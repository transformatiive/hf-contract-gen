// Hi Fly ACMI Contract Generator — static server + server-side PDF render
const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const FETCH_URL = "https://trnsf.up.railway.app/webhook/hifly-contract-fetch";

app.use(express.static(__dirname)); // serves index.html

// Build the merged contract HTML for a deal, server-side, reusing the same template.
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'contract_template.html'), 'utf8');
const CSS = fs.readFileSync(path.join(__dirname, 'contract_style.css'), 'utf8');

function mergeHtml(fields){
  if(fields.min_month_total===undefined) fields.min_month_total='';
  const body = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (m,k)=>{
    const v = fields[k];
    return v ? v : '<span class="missing">['+k+']</span>';
  });
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>${CSS}
@page{size:A4;margin:18mm 16mm}
body{background:#fff}
.page{width:100%;box-shadow:none;border:none;border-radius:0;padding:0}
h2.clause,h2.appx{page-break-after:avoid}
.defrow{page-break-inside:avoid}
</style></head><body><article class="page">${body}</article></body></html>`;
}

app.get('/api/pdf', async (req,res)=>{
  const dealId = (req.query.deal_id||'').toString();
  if(!dealId) return res.status(400).json({error:'deal_id required'});
  try{
    const r = await fetch(FETCH_URL+'?deal_id='+encodeURIComponent(dealId));
    const data = await r.json();
    const fields = data.fields||{};
    const html = mergeHtml(fields);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'hf-'));
    const htmlPath = path.join(tmp,'c.html');
    const pdfPath = path.join(tmp,'c.pdf');
    fs.writeFileSync(htmlPath, html);
    execFile('wkhtmltopdf', ['--enable-local-file-access','--quiet','--print-media-type',htmlPath,pdfPath], (err)=>{
      if(err){ console.error(err); return res.status(500).json({error:'pdf render failed',detail:String(err)}); }
      const pdf = fs.readFileSync(pdfPath);
      const safe = (fields.agreement_no||'contract').replace(/[^A-Za-z0-9._-]+/g,'_');
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline; filename="ACMI_'+safe+'.pdf"');
      res.setHeader('Access-Control-Allow-Origin','*');
      res.send(pdf);
      try{ fs.rmSync(tmp,{recursive:true,force:true}); }catch(e){}
    });
  }catch(e){ console.error(e); res.status(500).json({error:String(e)}); }
});

app.get('/healthz',(_,res)=>res.json({status:'ok'}));
app.listen(PORT, ()=>console.log('hf-contract-gen on '+PORT));
