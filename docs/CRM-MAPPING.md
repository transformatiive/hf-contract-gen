# HiFly Zoho CRM — field discovery notes

Datacenter: **EU** (`https://www.zohoapis.eu`). Credential lives in n8n
(`Zoho CRM HiFly`, id `DRXhp7RqsC8lAGeA`). Epic `TRNSF-96` in the credential vault.

## Deals — relevant fields (module has 54 total)
- `Deal_Name` (text) · `Company` (text) · `End_Customer_Name` (lookup → Contacts)
- `Contract_Aircraft` (lookup → Aircrafts) — display name is `"<Type> - <Tail>"`
- `Contract_Start_Date`, `Contract_End_Date` (date)
- `Lease_Rate_p_BH` (currency)
- `Contract_Details` (subform: Contract_Aircraft, Contract_Start_Date, Contract_End_Date)

## Aircrafts — relevant fields
- `Aircraft_Type` (picklist) · `Tail_Nr` (text) · `MSN` (double) · `Name` (text)
- pax config: `J_Class`, `F_Class`, `Y_Class`, `PY_Class`, `Total_Pax`

## Not in CRM (manual entry in app)
VAT, registered address, signatory, notices attn/tel/email, catering equipment,
cabin-crew experience, lease term text, lessee base airport, min guaranteed BH
(month/term), excess BH price, per diem, instructor per diem, hours:cycle ratio,
low-ratio surcharge, deposit, first advance month/date, alt jurisdiction, lease basis.
