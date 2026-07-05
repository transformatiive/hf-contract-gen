# Hi Fly — ACMI Wet Lease Contract Generator

Generates the **Aircraft Wet Lease Agreement (ACMI)** for Hi Fly Ltd from an
HTML template, merging dynamic fields **live from the Hi Fly Zoho CRM**. No Zoho
Writer. Single self-contained front-end (`index.html`) plus an n8n webhook that
holds the Zoho OAuth credential and returns the merge payload.

## Architecture

```
Browser (index.html)  ──GET──▶  n8n webhook  ──OAuth──▶  Zoho CRM (HiFly, EU DC)
   pick a Deal                  hifly-contract-fetch        Deals + Aircrafts
   merge → live A4 preview      returns merge JSON
   Generate PDF (print)
```

- **Front-end**: `index.html` — Deal picker, grouped field panel (CRM-auto vs
  manual), live A4 preview, print-to-PDF. Contains the full 14-clause + appendices
  template with `{{token}}` merge markers.
- **Backend**: n8n workflow `HiFly - Contract Data Fetch`
  (`FzMY94SadtOlt0up`) on `trnsf.up.railway.app`. The Zoho OAuth credential
  (`Zoho CRM HiFly`) lives in n8n — **no secrets in this repo or the browser**.

### Webhook contract
`GET /webhook/hifly-contract-fetch`
- no params → `{ status, count, deals:[{id,name,company,start,end,aircraft}] }`
- `?deal_id=<id>` → `{ status, deal_id, deal_name, fields:{…}, raw:{deal,aircraft} }`

### CRM field mapping (auto-filled)
| Contract field | Zoho source |
|---|---|
| Agreement ref | `Deals.Deal_Name` |
| Wet Lessee | `Deals.Company` (fallback `End_Customer_Name`) |
| Aircraft type / reg / MSN | `Aircrafts.Aircraft_Type` / `Tail_Nr` / `MSN` (via `Contract_Aircraft` lookup) |
| Delivery / Redelivery date | `Deals.Contract_Start_Date` / `Contract_End_Date` |
| Wet Lease Price (p/BH) | `Deals.Lease_Rate_p_BH` |

All other fields (VAT, address, deposit, per diem, ratios, jurisdiction, …) are
**not stored in the CRM** and are entered manually in the app before generating.

## Deploy (Railway)
Static site — Railway serves `index.html`. Any push to `main` redeploys.

Built by Transformatiive.
