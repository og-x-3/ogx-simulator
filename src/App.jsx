import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Zap, Droplet, Sprout, Shield, Radio, ArrowLeft, Check, Info, Wallet,
  AlertTriangle, Sparkles, RotateCcw, X, ChevronRight, ShoppingCart, HelpCircle, BarChart3,
  Share2, Save,
} from "lucide-react";

/* ============================================================================
   OGX OFF-GRID SIMULATOR  —  improved build
   Flow: Welcome (climate / setup / budget / tier / mode) -> Console (setup
   image + 3 clickable dashboards) -> per-thematic segmented "shop" pages,
   ordered exactly as the chapters run -> mystery-card stress test.
   Prices are starting placeholders, to be swapped for the fact-checked JSON.
   Not electrical-safety advice.
   ========================================================================== */

const C = {
  ink: "#15130E", panel: "#211D14", panel2: "#2B2618", line: "#3C3422",
  bone: "#ECE6D4", mute: "#9A9079", faint: "#6B6451",
  amber: "#EFA24A", amberDeep: "#C9742A",
  power: "#F2C14E", water: "#5AA9CE", food: "#86B85F", sec: "#D06A6A", comms: "#5FC9BE",
  over: "#D9534F", ok: "#86B85F",
};
const FONT_DISPLAY = '"Oswald","Arial Narrow",system-ui,sans-serif';
const FONT_MONO = '"JetBrains Mono",ui-monospace,Menlo,monospace';
const FONT_BODY = '"Inter",system-ui,-apple-system,sans-serif';

/* ----------------------------------------------------------------- DATA --- */

const CLIMATES = [
  { id: "tropics", name: "Tropics", emoji: "🌴", sun: 0.9, blurb: "Hot & humid, strong sun, storm/hurricane season, salt & UV everywhere." },
  { id: "arid", name: "Desert / Arid", emoji: "🏜️", sun: 1.0, blurb: "Scorching days, cold nights, brutal sun, water is the whole game." },
  { id: "temperate", name: "Temperate", emoji: "🍃", sun: 0.6, blurb: "Four mild seasons, decent rain, moderate sun, easy to live." },
  { id: "mediterranean", name: "Mediterranean", emoji: "🌿", sun: 0.75, blurb: "Hot dry summers, wet winters — drought stress in the dry months." },
  { id: "maritime", name: "Coastal / Maritime", emoji: "🌊", sun: 0.55, blurb: "Wet, windy, grey. Great wind, constant salt corrosion." },
  { id: "alpine", name: "Mountain / Alpine", emoji: "⛰️", sun: 0.6, blurb: "Thin air, snow load, big day/night swings, freezing nights." },
  { id: "boreal", name: "Cold / Boreal", emoji: "🌲❄️", sun: 0.4, blurb: "Long hard winters, short summers, low winter sun — freeze risk." },
];

const SETUPS = [
  { id: "catamaran", name: "Catamaran / Boat", emoji: "⛵", blurb: "Liveaboard sailing cat. Tight space, salt, motion — squeeze every watt." },
  { id: "van", name: "Camper Van", emoji: "🚐", blurb: "Mobile & stealthy. Minimal roof, minimal tank — efficiency rules." },
  { id: "stonecabin", name: "Stone Cabin", emoji: "🏚️", blurb: "Heavy thermal-mass walls in the hills. Stable temps, remote access." },
  { id: "earthship", name: "Earthship", emoji: "🏗️", blurb: "Earthbag / tire passive home. Bullet & fire proof, big thermal mass." },
  { id: "tinyhouse", name: "Tiny House", emoji: "🏠", blurb: "Small footprint on wheels or pad. Comfort through clever design." },
  { id: "homestead", name: "Land Homestead", emoji: "🚜", blurb: "Acreage. Room for food forest, animals, big tanks, maybe a river." },
  { id: "yurt", name: "Yurt / Camp", emoji: "⛺", blurb: "Canvas / glamping survival setup. The first 3-month transition base." },
];

const TIERS = {
  diy: { label: "Very DIY", mult: 0.5, sub: "Salvaged, second-hand, build-it-yourself" },
  mid: { label: "Medium", mult: 1.0, sub: "New budget gear, some DIY" },
  premium: { label: "Premium", mult: 2.0, sub: "Top brands, turnkey, warrantied" },
};

const o = (id, name, blurb, p, tags = [], why = "", config = null) => ({ id, name, blurb, p, tags, why, config });
const hasSolar = (h) => h.has("electricity","generate","panel100") || h.has("electricity","generate","panel200") || h.has("electricity","generate","panel400") || h.has("electricity","generate","panel450n") || h.has("electricity","generate","panelused");
const hasLithium = (h) => h.has("electricity","battery","lifepo4_100ah") || h.has("electricity","battery","lifepo4_diy");
const hasBackup = (h) => h.has("electricity","backup","gen_2000") || h.has("electricity","backup","gen_3500");

const THEMATICS = {
  electricity: {
    label: "Electricity", color: C.power, icon: Zap,
    short: "Power your off-grid life — from a single panel to a full home system.",
    intro:
      "Let's build your power system together, step by step. Start with what you actually need to run, pick a voltage, choose your panels and battery, then protect it all. Every option here is real gear you can buy — Renogy, Victron, Battle Born, Canadian Solar. No fluff, just what works.",
    steps: [
      {
        id: "needs", title: "1 · What will you run?", multi: true,
        intro: "Check everything you plan to power. This decides how big your system needs to be. A fridge + Starlink + lights = ~2 kWh/day. Add AC and you're at 4+. Don't worry — you can always add more panels later.",
        options: [
          o("lights", "LED lights", "~125Wh/day for 5 lights × 5h. 12V native, no inverter needed.", 30, ["diyfav"], "PROS: Cheapest load, runs on 12V directly. CONS: Easy to need 8-15 lights in a real house."),
          o("phones", "Phone + laptop", "~150Wh/day. USB-C charging is efficient. Negligible draw.", 0, [], "PROS: Barely counts. CONS: Every person adds to it."),
          o("starlink", "Starlink internet", "1.2-1.8 kWh/day — your biggest base load. 50-75W continuous.", 0, ["needsPower"], "PROS: Fast internet anywhere on Earth. CONS: Eats a full 100Ah battery every day just by itself."),
          o("dcfridge", "DC fridge/freezer", "360-600Wh/day. A chest fridge is 2-3× more efficient than upright.", 0, ["needsPower"], "PROS: Fresh food without propane. CONS: Usually your #1 or #2 power consumer."),
          o("waterpump", "Water pump", "60-120Wh/day for a 12V pump. Surge on startup.", 0, [], "PROS: 12V pumps sip power. CONS: AC well pumps need 1000W+ and a big inverter."),
          o("tools", "Power tools", "Occasional use. Grinder 900W running, 2500W+ surge to start.", 0, ["needsInv"], "PROS: Cordless tools skip the inverter entirely. CONS: Big AC tools decide your inverter size."),
          o("kitchen", "Kitchen appliances", "Blender 500W, microwave 1000W, induction 1800W. Adds up fast.", 0, ["needsInv"], "PROS: Electric cooking is nice. CONS: Induction needs 1800W+ inverter and big battery. Propane is usually smarter."),
          o("ac", "Air conditioning", "500-800W. Dominates your power budget in the tropics.", 0, ["needsPower"], "PROS: Survivable comfort in Panama heat. CONS: Will 3-5× your solar array size."),
        ],
      },
      {
        id: "voltage", title: "2 · Pick your voltage",
        intro: "12V, 24V, or 48V? This one choice affects everything. 12V is simplest but maxes out around 2000W. 24V is the sweet spot for most homes. 48V is for big systems with long wire runs. Once you pick, you commit.",
        options: [
          o("v12", "12V — simple & safe", "Vans, RVs, boats, small cabins. Inverter up to ~2000W. Thick cables above 150A.", 0, ["diyfav"], "PROS: Easiest to DIY, parts everywhere. CONS: Cables get thick and expensive above 2000W."),
          o("v24", "24V — the sweet spot", "Homes with 1000-3000W inverter. Half the current = quarter the losses.", 0, [], "PROS: Standard for residential off-grid. Works with most gear. CONS: Need DC-DC converter for 12V stuff."),
          o("v48", "48V — big & future-proof", "3000W+ homes, long wire runs. Required for 5kW+ inverters like EG4 and Sol-Ark.", 0, ["upgrade"], "PROS: Thinnest wires, most efficient. Works with server rack batteries. CONS: Limited 48V appliances, more dangerous — respect it."),
        ],
      },
      {
        id: "generate", title: "3 · Solar panels — pick your size", multi: true,
        intro: "Math: daily watt-hours ÷ 5 sun hours × 1.3 safety = watts needed. Panama gets ~5 peak sun hours year-round. Bigger panels cost less per watt but are heavier. Mix and match tiers — you can pick more than one.",
        options: [
          o("panel100", "100W panel — Renogy ~$80", "42×20\", 14 lbs. Perfect for small setups and tight spaces. Best value in 4-packs.", 80, ["diyfav"], "PROS: Light enough for one person. Fits anywhere. CONS: More wiring per watt. $0.80/W retail.",
            {budget:{min:80,max:8000,step:80,def:400},choices:[
              {key:"qty",label:"How many?",opts:[
                {id:"1",l:"1 panel (100W)",e:"Lights + phone only — ~500Wh/day"},
                {id:"2",l:"2 panels (200W)",e:"+ laptop + pump — ~1000Wh/day"},
                {id:"4",l:"4 panels (400W)",e:"+ fridge + Starlink — ~2000Wh/day"},
                {id:"6",l:"6 panels (600W)",e:"All basics + comfort — ~3000Wh/day"},
                {id:"8",l:"8 panels (800W)",e:"Full home base load — ~4000Wh/day"},
                {id:"12",l:"12 panels (1200W)",e:"Family home with margin — ~6000Wh/day"}
              ]},
              {key:"mount",label:"Mount type",opts:[
                {id:"zbracket",l:"Z-brackets +$20",e:"Flat mount — simplest. Good for RVs/sheds."},
                {id:"tilt",l:"Tilt legs +$45",e:"Adjustable angle. +10-15% more power."},
                {id:"ground",l:"Ground rack +$75",e:"Best cooling and access. Optimal tilt."}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||1;
              const watts = qty*100;
              const mt = v.mount==="tilt"?45:v.mount==="ground"?75:20;
              const panelCost = qty>=4?qty*65:qty*80;
              const dailyWh = Math.round(watts*4.5*0.82);
              return {fields:[
                ["Array",watts+"W ("+qty+"× Renogy 100W)"],
                ["Daily","~"+dailyWh+"Wh"],
                ["Cost","$"+(qty>=4?"0.65":"0.80")+"/W"],
                ["Mount",v.mount==="tilt"?"Tilt legs":v.mount==="ground"?"Ground rack":"Z-brackets"],
                ["Weight",(qty*14)+" lbs"]
              ],spent:Math.round(panelCost+mt*qty),budget:v._budget};
            }}),
          o("panel200", "200W panel — ~$190-220", "58×26\", 27 lbs. Great fit for RV roofs. One panel = most of the width.", 190, [], "PROS: Fewer mounting points. Good RV fit. CONS: Heavier to handle. Slightly more $/W than 100W 4-packs.",
            {budget:{min:190,max:8000,step:190,def:570},choices:[
              {key:"qty",label:"How many?",opts:[
                {id:"1",l:"1 panel (200W)",e:"Basic van/RV — ~1000Wh/day"},
                {id:"2",l:"2 panels (400W)",e:"+ fridge + Starlink — ~2000Wh/day"},
                {id:"3",l:"3 panels (600W)",e:"Comfortable RV living — ~3000Wh/day"},
                {id:"4",l:"4 panels (800W)",e:"Small cabin — ~4000Wh/day"},
                {id:"6",l:"6 panels (1200W)",e:"Family cabin — ~6000Wh/day"}
              ]},
              {key:"brand",label:"Brand",opts:[
                {id:"renogy",l:"Renogy $220",e:"Better warranty, US support"},
                {id:"richsolar",l:"Rich Solar $190",e:"Good value, slightly cheaper"}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||1;
              const price = v.brand==="renogy"?220:190;
              const dailyWh = Math.round(qty*200*4.5*0.82);
              return {fields:[
                ["Array",(qty*200)+"W ("+qty+"× 200W "+ (v.brand==="renogy"?"Renogy":"Rich Solar")+")"],
                ["Daily","~"+dailyWh+"Wh"],
                ["$/W","$"+(price/200).toFixed(2)],
                ["Weight",(qty*27)+" lbs"]
              ],spent:Math.round(qty*price),budget:v._budget};
            }}),
          o("panel400", "400W panel — ~$290", "79×39\", 50 lbs. The 2026 standard. Best $/W for serious systems. 2-person lift.", 290, ["upgrade"], "PROS: $0.69/W — cheapest per watt. Fewer panels = less labor. Half-cell = better in shade. CONS: Heavy, needs 2 people. Freight shipping.",
            {budget:{min:290,max:12000,step:290,def:1160},choices:[
              {key:"qty",label:"How many?",opts:[
                {id:"2",l:"2 panels (800W)",e:"2S on 150/35 — ~3280Wh/day"},
                {id:"3",l:"3 panels (1200W)",e:"3S on 150/60 — ~4920Wh/day"},
                {id:"4",l:"4 panels (1600W)",e:"2S2P on 150/70 — ~6560Wh/day"},
                {id:"6",l:"6 panels (2400W)",e:"3S2P on 150/100 — ~9840Wh/day"},
                {id:"8",l:"8 panels (3200W)",e:"4S2P on 250/100 — ~13.1kWh/day"},
                {id:"12",l:"12 panels (4800W)",e:"4S3P on RS 450 — ~19.7kWh/day"}
              ]},
              {key:"type",label:"Cell type",opts:[
                {id:"perc",l:"PERC mono +$0",e:"Standard. Fine for most climates."},
                {id:"ntype",l:"N-Type +$40",e:"Stays cooler in heat. Best for Panama."}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||2;
              const ntype = v.type==="ntype"?40:0;
              const pp = 290+ntype;
              const dailyWh = Math.round(qty*400*4.5*0.82);
              return {fields:[
                ["Array",(qty*400)+"W ("+qty+"× 400W "+(v.type==="ntype"?"N-Type":"PERC")+")"],
                ["Daily","~"+dailyWh+"Wh"],
                ["$/W","$"+(pp/400).toFixed(2)],
                ["Type",v.type==="ntype"?"N-Type TOPCon":"Mono PERC"],
                ["Voc/Vmp","49.8V / 41.7V · Imp 9.6A"],
                ["Weight",(qty*50)+" lbs"]
              ],spent:Math.round(qty*pp),budget:v._budget};
            }}),
          o("panel450n", "450W N-Type — ~$330", "82×41\", 52 lbs. Made for hot climates. Better temp coefficient saves real kWh in Panama.", 330, ["upgrade"], "PROS: -0.29%/°C beats PERC's -0.35%. Saves ~2% power in tropical heat. Longer warranty. CONS: A bit more $/W. Big and heavy.",
            {budget:{min:330,max:12000,step:330,def:1320},choices:[
              {key:"qty",label:"How many?",opts:[
                {id:"2",l:"2 panels (900W)",e:"2S on 150/35 — ~3690Wh/day"},
                {id:"3",l:"3 panels (1350W)",e:"3S on 150/60 — ~5535Wh/day"},
                {id:"4",l:"4 panels (1800W)",e:"2S2P on 250/60 — ~7380Wh/day"},
                {id:"6",l:"6 panels (2700W)",e:"3S2P on 250/60 — ~11.1kWh/day"}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||2;
              const dailyWh = Math.round(qty*450*4.5*0.82);
              return {fields:[
                ["Array",(qty*450)+"W ("+qty+"× 450W N-Type)"],
                ["Daily","~"+dailyWh+"Wh"],
                ["$/W","$0.73"],
                ["Why","-0.29%/°C vs -0.35% PERC in heat"],
                ["Best for","Panama · tropics · hot climates"]
              ],spent:Math.round(qty*330),budget:v._budget};
            }}),
          o("panelused", "Used panels — $45-150", "Decommissioned residential panels. Half the price of new. Test before buying.", 150, ["diyfav"], "PROS: $0.35-0.50/W — best value in solar. CONS: No warranty. Check for snail trails and delamination.",
            {budget:{min:80,max:3000,step:80,def:450},choices:[
              {key:"grade",label:"Grade",opts:[
                {id:"A",l:"Grade A $150",e:"<5yr old, >90% output, clean"},
                {id:"B",l:"Grade B $80",e:"Cosmetic wear, 80-90%. Fine for ground mount"},
                {id:"C",l:"Grade C $45",e:"Visible wear, 70-80%. Experimental only"}
              ]},
              {key:"qty",label:"How many?",opts:[
                {id:"2",l:"2 panels",e:"Workshop / backup"},
                {id:"4",l:"4 panels",e:"Small cabin"},
                {id:"8",l:"8 panels",e:"Serious budget array"}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||2;
              const price = v.grade==="A"?150:v.grade==="B"?80:45;
              const eff = v.grade==="A"?0.90:v.grade==="B"?0.85:0.75;
              const dailyWh = Math.round(qty*300*eff*4.5*0.82);
              return {fields:[
                ["Rated","~"+(qty*300)+"W ("+qty+"× Grade "+v.grade+")"],
                ["Actual","~"+(qty*300*eff)+"W after wear"],
                ["Daily","~"+dailyWh+"Wh"],
                ["$/W","$"+(price/300).toFixed(2)],
                ["⚠","Test Voc within 5% of label"]
              ],spent:Math.round(qty*price),budget:v._budget};
            }}),
          o("wind", "Wind turbine — ~$500-850", "Complements solar: wind blows at night and in storms. Needs >10mph average wind.", 750, [], "PROS: Power when the sun's down. CONS: Moving parts = maintenance. Noisy. Tower adds cost."),
          o("hydro", "Micro-hydro — ~$400-2000", "24/7 power if you have flowing water. No battery needed. The holy grail of off-grid.", 1500, ["constant"], "PROS: Runs regardless of weather. 50-70% efficient. CONS: Needs flowing water with enough head."),
        ],
      },
      {
        id: "controller", title: "4 · Charge controller", optional: true,
        relevant: (h) => h.any("electricity", "generate"),
        intro: "The brain of your system. MPPT squeezes ~25% more power from the same panels. Victron SmartSolar is what the pros use — Bluetooth, reliable, 5-year warranty. Match it to your panels: (A) total watts ÷ battery voltage × 1.25 = amps needed. (B) panels in series × Voc × 1.15 < controller max volts. Don't worry — the descriptions tell you what works.",
        options: [
          o("victron_75_15", "Victron 75/15 — ~$120", "Tiny systems. 220W max on 12V. 1-2 × 100W panels. Bluetooth built-in.", 120, [], "PROS: Real MPPT in the smallest package. CONS: 15A max. Only for tiny setups."),
          o("victron_100_20", "Victron 100/20 — ~$145", "Small systems. 290W on 12V. 2-3 × 100W or 1 × 400W. Most popular starter.", 145, [], "PROS: Perfect entry-level MPPT. CONS: 290W limit on 12V."),
          o("victron_100_30", "Victron 100/30 — ~$140", "Medium-small. 440W on 12V. Handles most van/RV setups. Amazon: $135.", 140, [], "PROS: 30A, great value. CONS: 100V — max 2 × 400W in series."),
          o("victron_100_50", "Victron 100/50 — ~$320", "Medium. 700W on 12V. 4-6 × 100W or parallel 400W strings. Fast charging.", 320, ["upgrade"], "PROS: 50A charging for bigger arrays. CONS: 100V limits series strings."),
          o("victron_150_35", "Victron 150/35 — ~$350", "The standard. 1000W on 24V. 3 residential panels in series. Most common off-grid choice.", 350, [], "PROS: 150V handles 3 big panels in series. CONS: Costs more than 100V series."),
          o("victron_150_60", "Victron 150/60 — ~$480", "Large 24V. 1720W on 24V. 3 × 400W in series. Handles most home arrays.", 480, ["upgrade"], "PROS: 60A, big headroom. CONS: Price jump from 150/35."),
          o("victron_150_100", "Victron 150/100 — ~$850", "Big systems. 5760W on 48V. 4kW+ arrays. Can parallel multiple units.", 850, ["upgrade"], "PROS: 100A, handles 5kW+. CONS: Expensive. Overkill for small systems."),
          o("victron_250_60", "Victron 250/60 — ~$680", "Long runs. 250V lets you use thin 10 AWG wire 200+ ft. Ground-mount arrays far from battery.", 680, ["upgrade"], "PROS: High voltage saves $$$ on wire. CONS: High voltage DC is dangerous."),
          o("pwm", "PWM controller — ~$30", "Budget option. Only efficient with 36-cell \"12V\" panels. Wastes 25%+ vs MPPT.", 30, ["diyfav"], "PROS: Dirt cheap. Works. CONS: Wastes power. Only for 36-cell panels."),
          o("epver", "EPever MPPT — ~$100", "Budget MPPT. Real tracking, not Victron quality but genuine MPPT. Good for secondary arrays.", 100, ["diyfav"], "PROS: Real MPPT at $100. CONS: No Bluetooth. Less refined than Victron."),
        ],
      },
      {
        id: "battery", title: "5 · Battery bank", multi: true,
        intro: "Your power when the sun's down. Size it: daily Wh ÷ voltage × days autonomy ÷ depth of discharge. Example: 2000Wh/day, 12V, 2 days, 80% DoD = 417Ah of LiFePO4. You can add more batteries later — parallel is common. For 3+ in parallel, use bus bars (equal cables = equal sharing).",
        options: [
          o("lifepo4_100ah", "LiFePO4 drop-in 100Ah", "Battle Born $949 / Renogy $350 / SOK $280. 10yr life, 80% usable, zero maintenance.", 350, [], "PROS: Just works. 10+ years. Half the weight of lead. CONS: Can't charge below freezing. Battle Born is premium; Renogy is great value.",
            {budget:{min:350,max:12000,step:350,def:1050},choices:[
              {key:"qty",label:"How many?",opts:[
                {id:"1",l:"1 × 100Ah (1.0kWh usable)",e:"Lights + phone + pump for 1 day"},
                {id:"2",l:"2 × 100Ah (2.0kWh)",e:"+ fridge + lights for 2 days"},
                {id:"4",l:"4 × 100Ah (4.1kWh)",e:"Comfortable home, 2-3 day autonomy"},
                {id:"8",l:"8 × 100Ah (8.2kWh)",e:"Family home, 3-5 day autonomy"}
              ]},
              {key:"brand",label:"Brand",opts:[
                {id:"renogy",l:"Renogy $350",e:"Great value. Bluetooth optional."},
                {id:"sok",l:"SOK $280",e:"Budget quality. Metal case. Good reviews."},
                {id:"battleborn",l:"Battle Born $949",e:"Premium. Heated option. 10yr warranty."}
              ]}
            ],output:(v)=>{
              const qty = parseInt(v.qty)||1;
              const price = v.brand==="battleborn"?949:v.brand==="sok"?280:350;
              const totalWh = qty*1280; const usableWh = Math.round(totalWh*0.8);
              return {fields:[
                ["Bank",qty+"× 100Ah = "+(qty*100)+"Ah @ 12.8V"],
                ["Energy",(totalWh/1000).toFixed(1)+"kWh ("+usableWh/1000+"kWh usable)"],
                ["Life","3000-5000 cycles · 10-15 years"],
                ["Wiring","BUS BAR for 3+ in parallel"],
                ["Weight",(qty*31)+" lbs"]
              ],spent:Math.round(qty*price),budget:v._budget};
            }}),
          o("lifepo4_diy", "DIY LiFePO4 — build it", "4 × 3.2V 280Ah EVE cells + BMS = ~$500. Same cells as premium brands. Save 40%.", 500, ["diyfav"], "PROS: Half the price of drop-in. Learn your system. CONS: Needs assembly. No warranty. Must top-balance cells.",
            {budget:{min:500,max:5000,step:500,def:500},choices:[
              {key:"cells",label:"Cells",opts:[
                {id:"280",l:"280Ah (3.6kWh) $500",e:"EVE LF280K — the standard DIY cell"},
                {id:"304",l:"304Ah (3.9kWh) $560",e:"EVE LF304 — newer, higher capacity"}
              ]}
            ],output:(v)=>{
              const ah = v.cells==="304"?304:280;
              const price = v.cells==="304"?560:500;
              const wh = ah*12.8;
              return {fields:[
                ["Capacity",ah+"Ah @ 12.8V = "+(wh/1000).toFixed(1)+"kWh"],
                ["Usable",(wh*0.8/1000)+"kWh (80% DoD)"],
                ["$/kWh","$"+(price/(wh/1000)).toFixed(0)],
                ["Save","~$200-400 vs drop-in"],
                ["⚠","Top-balance cells. Torque busbars. Configure BMS."]
              ],spent:price,budget:v._budget};
            }}),
          o("agm_100ah", "AGM deep-cycle 100Ah", "~$200. Sealed, no maintenance. 50% usable. 500-800 cycles. Heavy but reliable.", 200, [], "PROS: No watering, no venting. Better than flooded. CONS: Only 50% usable. Heavy. 3-5 year life."),
          o("lead_100ah", "Flooded lead-acid 100Ah", "~$130. Cheapest upfront. Needs watering and ventilation. 500 cycles. Heavy.", 130, ["diyfav"], "PROS: Cheapest per amp-hour. Recyclable. CONS: Must water regularly. Hydrogen gas — needs venting. Short life."),
          o("sodium", "Sodium-ion / LTO — $400+/kWh", "New tech: LTO charges at -30°C, 20k cycles. Sodium-ion is cobalt-free. Still early.", 1600, ["upgrade"], "PROS: LTO works in extreme cold. Sodium is safe. CONS: Early-stage, expensive, hard to find."),
        ],
      },
      {
        id: "inverter", title: "6 · Inverter",
        intro: "Only needed for AC stuff. Pure sine wave only — modified sine kills electronics. Size for SURGE (startup), not running watts. A 900W grinder needs 2500W+ to start. 12V systems max at ~2000W — go 24V or 48V above that.",
        options: [
          o("no_inv", "No inverter — DC only", "Most efficient. LED lights, DC fridge, USB charging all run native on DC. Zero standby draw.", 0, ["diyfav"], "PROS: Zero losses. Simplest. CONS: No AC appliances."),
          o("inv_1000", "1000W pure sine — ~$300", "Victron Phoenix or Renogy. Laptops, TV, blender. Surge: 2000W. Idle: ~10W.", 300, [], "PROS: Low idle draw. Handles small AC loads. CONS: Won't start big motors."),
          o("inv_2000", "2000W pure sine — ~$400", "Victron MultiPlus or Renogy. Microwave, washer, tools. Surge: 4000W. The van standard.", 400, [], "PROS: Runs most household stuff. CONS: On 12V, draws 167A — needs 2/0 AWG cable."),
          o("inv_3000", "3000W pure sine — ~$800", "Victron MP-II 48V or EG4. Whole home. Surge: 6000W. Needs 24V or 48V.", 800, ["upgrade"], "PROS: Runs well pump, AC, induction cooktop. CONS: Needs 24V+. Idle ~30W."),
          o("inv_charger", "Inverter-charger — ~$1400", "Victron MultiPlus-II. Inverter + charger + transfer switch in one. Clean, space-saving.", 1400, [], "PROS: 3 devices in 1. Auto transfer. CONS: Premium price."),
        ],
      },
      {
        id: "wiring", title: "7 · Wiring & protection", multi: true,
        intro: "The stuff that prevents fires. Fuse both sides of the charge controller. MC4 connectors need the right crimper — pliers = fire risk. Bus bars for 3+ parallel batteries with equal cable lengths. Don't skip this stuff.",
        options: [
          o("pv_wire", "10 AWG PV wire + MC4", "~$80. UV-resistant. Standard for arrays up to 30A. 8 AWG for runs over 50ft.", 80, ["safety"], "PROS: Rated for 30+ years outdoors. CONS: Buy genuine MC4s, not Amazon knockoffs."),
          o("combiner", "Combiner box", "~$123. Required for 3+ parallel strings. Fuses each string. MidNite MNPV6.", 123, ["safety"], "PROS: Safe, code-compliant. CONS: Another box to mount."),
          o("breakers", "DC breakers + fuses", "~$80. MidNite breakers. ANL fuse for battery main. Class-T for LiFePO4 (5000A interrupt).", 80, ["safety"], "PROS: Proper DC breakers don't weld shut. CONS: DC breakers cost more than AC."),
          o("busbar", "Bus bar kit", "~$50. Blue Sea or Victron Lynx. Required for 3+ batteries. Equal cables = equal sharing.", 50, [], "PROS: Prevents battery murder. CONS: Must torque properly."),
          o("grounding", "Ground rod + wire", "~$60. 8ft copper rod + #6 AWG wire. Bond all panels and equipment to earth.", 60, ["safety"], "PROS: Lightning protection. Code requirement. CONS: Driving the rod is work."),
          o("surge", "Surge protector", "~$90. MidNite SPD. 50kA capacity. Protects from nearby lightning.", 90, ["safety"], "PROS: Cheap insurance. CONS: Replace after big surges."),
          o("monitor", "Battery monitor", "~$130. Victron SmartShunt or BMV-712. Know your real state of charge — voltage lies.", 130, [], "PROS: Most useful accessory. Prevents battery murder. CONS: $130, but pays for itself."),
        ],
      },
      {
        id: "backup", title: "8 · Backup generator", optional: true, multi: true,
        intro: "Your insurance policy. Even great solar has bad weeks. A generator you haven't tested in months isn't a backup — it's a paperweight. Inverter generators = clean power. Conventional = cheaper but dirtier.",
        options: [
          o("gen_2000", "2000W inverter gen — ~$550", "Champion or Honda. Quiet (53 dB). 0.4 gal/hr. Runs fridge + lights + charges battery.", 550, [], "PROS: Quiet, efficient, clean. CONS: Won't run big tools. Fuel storage needed."),
          o("gen_3500", "3500W generator — ~$750", "Predator or Champion. Runs well pump, washer, charges fast. 0.6 gal/hr.", 750, [], "PROS: Handles heavy loads. CONS: Heavier, louder, more fuel."),
          o("gen_charger", "AC battery charger — ~$170", "Victron Blue Smart 30A. Safe charging from generator to battery. Multi-chemistry.", 170, [], "PROS: Controlled, safe charging. CONS: 30A @ 12V = slow charging."),
          o("gen_autostart", "Auto-start — ~$250", "Magnum ME-AGS-N or Atkinson. Auto-starts gen when battery is low. Stops when charged.", 250, ["upgrade"], "PROS: Fully automatic. CONS: Only for electric-start gens."),
        ],
      },
      // ---- Security & Comms ----
      // ---- Security options (absorbed from Security thematic) ----
      {
        id: "detect", title: "9 · Security — detect & deter", multi: true,
        intro: "Half the job is deterrence — they'll skip the place with a barking dog. Stack a few layers.",
        options: [
          o("dog", "Watchdog", "Hears & smells trouble before you do. Best low-tech alarm there is.", 100, [], "The best security system ever: a barking dog deters most intruders, alerts you to everything (including fires and wild animals), and costs food and love. Don't underestimate this."),
          o("motion", "Motion lights", "Cheap PIR floodlights; pair with a chime or message.", 80, [], "Sudden bright light startles intruders and tells YOU someone's approaching. Cheap, low-power, effective. Add a PIR chime inside to hear movement near the house."),
          o("alarm", "Intrusion alarm sensors", "Pressure/magnetic sensors, bought or DIY.", 120, [], "Magnetic door switches, pressure mats, window break sensors. Wire them to a siren and a notification system. Simple, reliable, low-power."),
          o("cameras", "Camera system", "From fake blinkers to solar AI cameras streaming to your phone.", 300, ["needsPower"], "Modern solar Reolink/Eufy cameras transmit to your phone over WiFi. AI can distinguish people from animals. Useful for remote monitoring but needs decent internet and power."),
          o("fiber", "Optical-fiber perimeter", "Vibration on a fiber loop flags movement over a big perimeter. Cheap area cover, no visual.", 250, [], "Bury a fiber optic cable around your perimeter. Vibration from footsteps triggers an alert. Covers a large area for cheap, works in all weather. No false triggers from animals."),
          o("drone", "Self-launching drone", "Auto-patrol with a speaker — serious deterrent.", 900, [], "A drone that auto-launches, patrols your perimeter, and can speak to intruders. Very effective deterrent but expensive. Worth it for larger homesteads."),
        ],
      },
      {
        id: "harden", title: "10 · Harden the home", multi: true, optional: true,
        intro: "Make at least one part of the house genuinely secure.",
        options: [
          o("door", "Strong door + earthbag walls", "Earthbag is bullet- & fire-proof; add a heavy door barred inside.", 300, [], "Earthbag walls (stacked bags of subsoil) are bulletproof and fireproof. Add a heavy steel door with interior bar — you now have a safe room. The simplest hardening."),
          o("saferoom", "Safe room + escape tunnel", "A hardened (often underground) room with a way out.", 600, [], "A dedicated safe room with reinforced walls, ventilation, and an escape tunnel. Costlier but gives you a secure fallback during the worst scenarios."),
          o("lexan", "Lexan / barred windows", "Polycarbonate or bars on vulnerable openings.", 180, [], "Windows are the weakest point. Lexan polycarbonate is 250x stronger than glass. Steel bars are even stronger but look more 'fortress-like'. Pick based on your threat model."),
        ],
      },
      {
        id: "fire", title: "11 · Fire safety", multi: true,
        intro: "Your DIY electrics are the #1 fire risk, and you're far from any fire brigade. Be over-stocked.",
        options: [
          o("fireball", "Fire-balls (auto extinguishers)", "Sit in the battery cabinet; pop & smother a fire automatically.", 90, ["safety"], "Tennis-ball sized auto-extinguishers. When a fire starts nearby, they pop and release dry chemical. Place one in your battery cabinet and one near the inverter. Cheap fire insurance."),
          o("extinguishers", "Extinguisher stock", "Several, spread around. You're your own fire service.", 120, [], "You are the fire department. Have extinguishers in the kitchen, battery room, workshop, and near every heat source. Inspect and rotate them annually."),
          o("tempmon", "Temp monitoring on electrics", "Alarms on charger / controller / battery hot-spots.", 110, ["safety"], "Temperature sensors on batteries, controller, and inverter that alarm via your phone if something overheats. Catches the problem before it becomes a fire."),
          o("firepump", "Dedicated fire pump / reserve", "Pump that can drain a pond/pool onto a fire.", 300, [], "A gas-powered or DC pump dedicated to firefighting. If you have a pond, pool, or large tank, this can deliver hundreds of liters per minute onto a fire."),
        ],
      },
      {
        id: "community", title: "12 · Community link", optional: true,
        intro: "A neighbour network beats any gadget — security, advice, seeds, extra hands.",
        options: [
          o("radionet", "Radio / mesh neighbour net", "Stay in touch with neighbours for help & check-ins.", 150, [], "A VHF or Meshtastic network connecting your neighbours. Check in daily, share warnings, help each other. Social resilience is the strongest security you can buy."),
          o("none", "Go it alone", "Fully solo. Make sure your comms-for-help is rock solid.", 0, [], "Solo off-grid has romantic appeal but is genuinely dangerous without backup. If you choose this, invest heavily in reliable emergency comms (satellite messenger + PLB)."),
        ],
      },
      // ---- Communications options (absorbed from Communications thematic) ----
      {
        id: "localcomms", title: "13 · Local / short-range comms", multi: true,
        intro: "Talk to people on or near the property without any internet.",
        options: [
          o("vhf", "VHF radio", "Marine/handheld voice — essential on a boat & between buildings.", 120, [], "Marine VHF is mandatory for boat dwellers. Handheld VHF radios work across a homestead. No infrastructure needed — just two radios on the same channel."),
          o("gmrs", "GMRS / PMR handhelds", "Cheap walkie-talkies for the homestead & work crews.", 60, [], "Cheap, simple, license-free (in most countries for PMR). Great for coordinating work across the property. ~1-5 km range depending on terrain."),
          o("mesh", "Meshtastic LoRa mesh", "Tiny solar nodes form a text mesh over km, off-internet.", 150, [], "Solar-powered LoRa radio nodes form a text-messaging mesh. Works completely off-grid, over tens of kilometers. Each node costs ~$30. Brilliant for community networking."),
        ],
      },
      {
        id: "internet", title: "14 · Internet / long-range comms", multi: true,
        intro: "Your link to income and the world. Starlink is the off-grid game-changer — but it runs 24/7 and eats power.",
        options: [
          o("starlink", "Starlink", "High-speed anywhere. The income enabler — watch the power draw.", 499, ["needsPower"], "True game-changer: 100+ Mbps anywhere with a clear sky. But draws 50-100W continuous — that's 1.2-2.4 kWh/day. Make sure your solar bank can handle the always-on load."),
          o("lte", "4G/LTE router + antenna", "If there's any cell signal, a roof antenna can pull it in cheap.", 200, [], "If you have 1-2 bars on your phone, a $50 roof antenna + $50 router can turn that into usable internet. Much lower power draw than Starlink (~10W). Always worth checking first."),
          o("hf", "HF / SSB radio", "Long-range voice with no infrastructure at all.", 500, [], "High Frequency radio can reach across continents. No satellites, no towers. Essential for emergency comms when everything else is down. Ham license required in most countries."),
          o("satmsg", "Satellite messenger", "inReach/PLB — texts & SOS from literally anywhere.", 350, [], "Garmin inReach or Zoleo: two-way text messaging via satellite. Also has an SOS button that alerts emergency services with your GPS coordinates. Mandatory safety gear."),
        ],
      },
      {
        id: "commspower", title: "15 · Comms power & resilience", optional: true,
        intro: "Comms are only as reliable as the power behind them.",
        options: [
          o("dedicated", "Dedicated solar + battery", "A small separate system so comms survive a main-bank failure.", 300, [], "A small 50W panel + 50Ah battery just for your router and radios. Even if your main system fails, you still have comms. This saves you when everything else is down."),
          o("budget", "Budget it into main bank", "Account for the 24/7 router/Starlink load in your power plan.", 0, ["needsPower"], "Simply include the comms draw in your main power budget. Works as long as your main system is running. Add 50-100W to your daily load calculation."),
        ],
      },
    ],
  },

  water: {
    label: "Water", color: C.water, icon: Droplet,
    short: "Gather it, move it, store it, make it safe.",
    intro:
      "Water is THE make-or-break resource. The chapter hammers one thing: redundancy. Aim for at least three sources. And whenever you can, let gravity do the work — gravity rarely breaks down.",
    steps: [
      {
        id: "collect", title: "1 · Gather water", multi: true,
        intro: "Where the water comes from. Pick several — a source that fails with no backup is a real off-grid nightmare.",
        options: [
          o("streambox", "Stream — buried intake box", "Tap groundwater BESIDE the stream (pre-filtered, clog-free). Recommended.", 220, ["diyfav"], "The gold standard for stream collection. You dig beside the stream, not in it — the soil acts as a natural pre-filter. No clogs, less contamination. Always do this over direct intake."),
          o("streamdirect", "Stream — direct intake", "Pipe straight in the river. Simple but clogs & catches contamination.", 90, ["risk"], "Cheap and quick — but bad idea long-term. Clogs with debris, catches sediment and dead animals. Only use as a temporary setup while you build a buried intake box."),
          o("ground", "Shallow ground source", "Dig the greenest spot; funnel a seep into a small well.", 180, [], "If you don't have a stream, dig where the vegetation is lushest — you'll likely hit shallow groundwater. Simple but depends on the water table. Good supplemental source."),
          o("borewell", "Borewell + submersible pump", "Narrow DIY-drilled well into a deep aquifer. Lots of water.", 3500, [], "Expensive but gives you a reliable, deep aquifer that doesn't fluctuate with seasons. Needs a pump (powered) and some drilling know-how. The gold standard for land-based setups.",
            {budget:{min:1000,max:5000,step:200,def:3500},choices:[
              {key:"depth",label:"Depth",opts:[{id:"shallow",l:"100ft +$0",e:"Good shallow aquifer, lower lift cost"},{id:"deep",l:"250ft +$500",e:"Deeper aquifer, more stable yield"},{id:"verydeep",l:"500ft +$1500",e:"Very deep, highest yield, expensive drilling"}]}
            ],output:(v)=>{const dc=v.depth==="deep"?500:v.depth==="verydeep"?1500:0;const depth=v.depth==="shallow"?100:v.depth==="deep"?250:500;const gpm=depth>=250?12:8;const dailyGal=gpm*60*4;return{fields:[["Depth",depth+"ft"],["Flow rate",gpm+" GPM"],["Daily yield",Math.round(dailyGal).toLocaleString()+" gal/day"],["Pump included","Submersible 12V"]],spent:Math.round(3500+dc),budget:v._budget};}}),
          o("rain", "Rainwater + first-flush", "Roof, gutters, first-flush diverter. Always worth adding for backup.", 250, [], "Free water that falls on your roof. A first-flush diverter sends the first dirty mm down the drain. Always worth adding as a SECONDARY source — never rely solely on rain.",
            {budget:{min:100,max:1000,step:50,def:350},choices:[
              {key:"roof",label:"Roof area",opts:[{id:"small",l:"500 sqft +$0",e:"Small cabin/van roof, ~1,000 gal/yr in moderate rain"},{id:"med",l:"1,000 sqft +$100",e:"Average house roof, ~2,000 gal/yr"},{id:"large",l:"2,000 sqft +$250",e:"Large barn/homestead roof, ~4,000 gal/yr"}]}
            ],output:(v)=>{const rc=v.roof==="med"?100:v.roof==="large"?250:0;const sqft=v.roof==="med"?1000:v.roof==="large"?2000:500;const galYr=Math.round(sqft*0.6*40);const galMo=Math.round(galYr/12);return{fields:[["Roof area",sqft+" sqft"],["Annual harvest",galYr.toLocaleString()+" gal"],["Monthly avg",galMo.toLocaleString()+" gal"],["Includes first-flush","Yes"]],spent:Math.round(250+rc),budget:v._budget};}}),
          o("ro", "Desalination — RO unit", "Near the sea, no fresh water. ~$300-10k, needs prefilter, fragile membrane.", 3000, [], "Only if you're coastal with no fresh water. Reverse osmosis removes salt, but it's energy-intensive, the membranes are fragile (no chlorine!), and you need strong prefiltration. Expensive but necessary. For mariners."),
          o("solarstill", "Desalination — solar still", "Low-tech evaporation, cheap, slow. Mad-Max distilling option.", 180, ["diyfav"], "The low-tech path to desalination. Uses sunlight to evaporate and condense fresh water. Produces maybe 1-3L/day per square meter. Good for emergency backup or supplement, not primary."),
          o("air", "From the air (fog / AWG)", "Fog nets or atmospheric generator. Last resort, energy-hungry.", 700, [], "Atmospheric water generators are energy hogs (300-600 Wh/L). Fog nets work passively but only in specific microclimates. A last resort when no other source exists."),
        ],
      },
      {
        id: "move", title: "2 · Move the water",
        intro: "Lift it from source to tank. Gravity first; a ram pump runs on river flow alone (some have lasted a century).",
        options: [
          o("gravity", "Gravity feed", "Source above the house = no moving parts, nothing to break.", 100, ["diyfav"], "The absolute best if you can manage it. Source higher than the tap = free water forever with zero energy and zero moving parts. No brainer. Design your layout around this if possible."),
          o("ram", "Ram pump", "Powered only by the river's own flow. Cheap, DIY, near-eternal.", 200, ["diyfav"], "Brilliant engineering: uses the momentum of falling water to pump some of it uphill. No electricity, no fuel, almost no maintenance. Some ram pumps have been running for 100+ years."),
          o("manual", "Manual pump", "Robust, reliable, a bit of a workout. Good emergency backup.", 200, [], "Hand pump — reliable, never runs out of battery. Use as backup when other systems fail. Deep well hand pumps can lift from 100+ feet."),
          o("pump12", "12V electric pump", "Runs off solar/battery. Many are self-priming; bleed air if not.", 160, [], "The modern default. A good 12V diaphragm pump (e.g., Seaflo) draws ~5A and can lift from 10-15 feet. Needs priming if the suction line runs dry."),
          o("pumpac", "AC pump (needs inverter)", "Higher capacity, but depends on your inverter or genset.", 240, ["needsInv"], "For high-volume needs (irrigation, filling large tanks). Requires an inverter running, so plan for that power draw. Better for occasional big lifts than continuous use."),
        ],
      },
      {
        id: "store", title: "3 · Store water", optional: true,
        intro: "The chapter's model: a big long-term tank, a mid prefiltered tank, a small daily double-filtered tank. Keep tanks out of the sun & sealed so nothing lives in them.",
        options: [
          o("repurposed", "Repurposed plastic drums", "Old fuel/food containers (like on the island). Cheap, keep shaded.", 80, ["diyfav"], "Cheapest storage. Find IBC totes or blue 55-gallon drums. Must be food-grade. Keep them UV-protected or they'll grow algae. Great starter tanks."),
          o("poly", "Poly water tank", "Purpose-built, long-lasting. Bigger ones get pricey.", 280, [], "The standard for permanent water storage. UV-stabilized, food-grade polyethylene. Available in any size up to 10,000L. Lasts decades if kept off the ground."),
          o("flexible", "Flexible bladder", "Collapsible — perfect for boats/vans and tight spaces.", 340, [], "Great when space is tight: folds flat when empty. But more puncture-prone than rigid tanks. Use where you can't fit a hard tank."),
          o("ferro", "Ferrocement cistern", "Cement over mesh — custom shapes, big volume, low cost/L.", 600, ["diyfav"], "Build your own tank shape with chicken wire and cement. Very low cost per liter. Labour-intensive but can produce huge cisterns (10,000L+) for pennies."),
          o("brick", "Brick & cement cistern", "Big static storage; more build labour.", 900, [], "More refined than ferrocement — brick walls with cement render. Looks better, lasts forever. More material cost but still less than equivalent poly tank."),
          o("plywoodfg", "Plywood + fiberglass", "DIY watertight box with epoxy + food-grade paint.", 320, ["diyfav"], "A clever DIY box: plywood frame, coated with fiberglass resin and food-grade epoxy. Can fit into oddly-shaped spaces. Needs good ventilation during construction."),
          o("metal", "Stainless / metal tank", "Clean and durable; stainless is best (and priciest).", 1200, [], "Stainless steel doesn't leach, doesn't grow algae, lasts forever. But expensive and heavy. Galvanized steel is cheaper but can rust eventually."),
          o("level", "+ Tank level indicator", "Float gauge or ultrasonic-to-phone so you know your autonomy.", 90, ["upgrade"], "Knowing your water level means you can plan. A simple sight tube costs nothing. Ultrasonic sensors paired with your phone give remote monitoring. Never run dry unexpectedly."),
        ],
      },
      {
        id: "filter", title: "4 · Filter & purify", multi: true,
        intro: "No single method is 100% safe — STACK them. Particles, microbes, viruses, chemicals, metals each need a different trick.",
        options: [
          o("prefilter", "Prefilter (gravel/sand/charcoal)", "DIY first stage. Comes out pretty clean — but not guaranteed.", 60, ["diyfav"], "The first line of defense: removes sediment, most protozoa, and some bacteria. A stacked bucket filter (fine sand, charcoal, gravel) is cheap and effective. Not enough alone."),
          o("berkey", "Berkey clay + carbon", "Gravity ceramic + activated carbon. Solid everyday filter.", 280, [], "Gravity-fed ceramic filter with carbon core. Removes bacteria, protozoa, chemicals, heavy metals. Slow (3-4 L/h) but doesn't need power. A reliable workhorse."),
          o("silver", "Colloidal-silver clay", "Clay pot + silver kills bacteria & stops regrowth. Low upkeep.", 120, ["diyfav"], "Ancient technology: porous clay pot (sometimes with colloidal silver) filters bacteria and keeps the filter itself from growing mold. Cheap, effective, long-lasting. Pair with carbon for chemicals."),
          o("multistage", "Multistage + ultrafilter", "Pool-style stages finished with an ultrafiltration cartridge.", 360, [], "A series of stages: sediment, carbon, ultrafiltration (0.02 micron). Removes virtually everything including viruses. Needs moderate pressure to run. Higher flow than gravity."),
          o("straw", "Personal straw + pressure pump", "Cheap survival straws + a pump = very safe water (~700L/filter).", 90, ["diyfav"], "Survival straws are tiny, cheap, and effective against bacteria + protozoa. Add a hand pump and you have a portable filtration station. Filters ~700L before replacement."),
          o("uv", "UV-C purifier", "Kills bacteria & viruses (doesn't filter solids). Pair with a filter.", 190, [], "UV light destroys microbe DNA. Kills bacteria and viruses instantly but DOES NOT filter solids or chemicals. Always use AFTER a particulate filter. Needs electricity."),
          o("sodis", "SODIS (sun in bottles)", "Free UV from the sun. Zero cost, slow, weather-dependent.", 0, ["diyfav"], "Put clear PET bottles in full sun for 6+ hours. UV + heat pasteurizes the water. Zero cost, works in emergencies. Cloud-dependent and doesn't remove chemicals."),
          o("boil", "Boil", "Kills all biologicals. Costs fuel/energy but bulletproof.", 0, [], "Boiling kills everything — bacteria, viruses, protozoa, cysts. Fuel-hungry but absolutely reliable. The gold standard in emergencies. Doesn't remove chemicals."),
        ],
      },
      {
        id: "use", title: "5 · Usage, hot water & greywater", multi: true, optional: true,
        intro: "How you actually live with it. On-demand pumps are comfy but burn water fast. Reuse greywater on the garden — never with bleach.",
        options: [
          o("ondemand", "On-demand pressure pump", "Kicks in at the tap. Comfortable — and a water-guzzler.", 180, [], "Open the tap and water flows at pressure. Very convenient but encourages high water use. An accumulator tank smooths the pressure and extends pump life."),
          o("footpump", "Foot / manual tap pump", "Forces you to pump = forces you to save water.", 60, ["diyfav"], "Each pump gives you exactly the water you need. Conscious water use is built in. Great for dry climates where every liter counts. Simple, repairable, no power needed."),
          o("hotsolar", "Solar / thermosiphon hot water", "Black collector + tank above it, no pump needed.", 250, ["diyfav"], "A black-painted tank or pipe in the sun plus a tank above it = thermosiphon circulation. No pump, no controller, just free hot water. The most energy-efficient way to heat water."),
          o("hotfire", "Fire / rocket / compost heat", "Double-use your cooking or heating fire to warm water.", 150, [], "Every fire you make can also heat water. A simple coil in the stove or a heat-exchanger on the flue. Maximizes every BTU you burn. Works with rocket stoves, wood stoves, even compost."),
          o("mist", "Mist shower", "Astronaut-style fog wash — tiny water use.", 80, ["upgrade"], "Uses a misting nozzle to atomize water. A 5-minute shower uses ~2 liters instead of 20+. Feels surprisingly normal. Great for water-scarce setups."),
          o("greywater", "Greywater garden system", "Gravel + plants filter sink/shower water out to fruit trees.", 120, ["diyfav"], "Every drop of shower/sink water goes to irrigate fruit trees or ornamentals. Simple gravel + plant filter. Never use bleach or harsh chemicals if you greywater."),
        ],
      },
    ],
  },

  food: {
    label: "Food", color: C.food, icon: Sprout,
    short: "Grow, raise, preserve and cook your own food.",
    intro:
      "This chapter is a big menu — the trick is start with ONE thing, get a win, then expand. Outside (permaculture, the long game) and inside (controlled, fast, pest-free) work best together.",
    steps: [
      {
        id: "grow", title: "1 · Grow outside", multi: true,
        intro: "Working with the land. Food forests are the lazy-genius long game; raised beds + compost get you eating fast.",
        options: [
          o("beds", "Raised beds + compost", "Fast wins. Compost, worm bins, biochar build the soil.", 200, ["diyfav"], "The fastest path to eating from your land. Raised beds warm up faster in spring, drain well, and are easier to weed and maintain. Start here for quick wins."),
          o("forest", "Food forest (guilds)", "7 layers, self-supporting, forgiving. Sticks now, abundance later.", 300, ["upgrade"], "Plant like a forest: canopy trees, understory shrubs, ground cover, root crops, vines, climbers, mushrooms. Self-fertilizing, low-maintenance once established. The long game."),
          o("earthworks", "Earthworks / swales", "Swales & ponds recharge groundwater and drought-proof the land.", 250, [], "Swales (trenches on contour) capture rainwater and let it soak into the ground. They recharge groundwater, prevent erosion, and create microclimates. Essential in dry climates."),
          o("animals", "Chickens / small animals", "Eggs, meat, pest control, manure. Needs protection.", 350, ["needsSec"], "Chickens, rabbits, goats — they convert scraps into eggs/milk/meat and produce manure for the garden. But they need secure housing against predators and climate."),
        ],
      },
      {
        id: "controlled", title: "2 · Controlled growing", multi: true, optional: true,
        intro: "Indoors / protected: fast, pest-free, freeze-proof. Mushrooms don't even need light.",
        options: [
          o("microgreens", "Microgreens", "Windowsill, ~2 weeks to harvest, almost impossible to fail.", 60, ["diyfav"], "The easiest food you'll ever grow. Seeds sprout in 7-14 days on a windowsill. Nutrient-dense, no pests, no soil issues. Perfect starter project."),
          o("greenhouse", "Greenhouse (or buried)", "Changes everything in cold climates; a buried one even more.", 500, [], "Extends your growing season by months. A buried greenhouse (walipini) uses earth's thermal mass to stay warm. In cold climates this is transformative — fresh greens year-round."),
          o("hydro", "Hydroponics (Kratky/NFT)", "Soil-free, fast. Kratky is passive; NFT/drip need a pump.", 300, ["needsPower"], "Grows plants 30% faster using nutrient solution instead of soil. Kratky method is completely passive (no pump). NFT needs a small pump. Great for herbs, lettuce, tomatoes."),
          o("aquaponics", "Aquaponics", "Fish + plants loop. More moving parts, more reward.", 450, ["needsPower"], "Closed loop: fish waste feeds plants, plants clean water for fish. More complex than hydroponics (need fish care) but produces both vegetables AND protein. Once balanced, very low input."),
          o("mushrooms", "Mushrooms", "No light needed, loves the humidity of a misting shower.", 120, ["diyfav"], "Grow protein in the dark. Oyster mushrooms on straw or coffee grounds are fast (3-4 weeks) and easy. Shiitake on logs is longer-term. No light, no soil, just humidity."),
        ],
      },
      {
        id: "preserve", title: "3 · Preserve & store", multi: true, optional: true,
        intro: "From the kitchen chapter: keep the harvest without (much) power. A DC fridge will likely be your single biggest electrical load.",
        options: [
          o("cellar", "Cold room / root cellar", "Underground stable cool — everything lasts longer, zero power.", 200, ["diyfav"], "Dig a hole, insulate the ceiling, add root-vegetable storage. Zero energy, stable 5-10C year-round. The most important preservation method — cool storage without electricity."),
          o("dcfridge", "12V DC fridge/freezer", "Efficient chest design ~100W/day — but still your top power draw.", 600, ["needsPower"], "Will likely be your single biggest power consumer. DC chest fridges (like Truckfridge or Engel) use ~30-40Ah/day. Well worth it for fresh food, but size your solar around it."),
          o("jars", "Jars / ferment / salt / oil", "Canning, fermenting, salting, oil-preserving. Cheap & ancestral.", 120, ["diyfav"], "Water-bath canning, lacto-fermentation, salt curing, oil preserving — all work at room temperature. Zero energy. Ancient techniques that keep food for years."),
          o("dryer", "Solar dryer / smoker", "Dry & smoke for long storage and great flavour.", 120, ["diyfav"], "A simple solar dryer (mesh trays + glass cover) dries fruits, vegetables, meat. Smoking adds flavor and preservation. Both work with just sun and airflow."),
          o("desertfridge", "Desert (evaporative) fridge", "Clay + sand + water keeps produce cool, no electricity.", 60, ["diyfav"], "A clay pot inside a larger pot, with sand in between kept wet. Evaporation cools the inner pot by 5-10C. Zero energy. Keeps produce for days longer. Works best in dry climates."),
        ],
      },
      {
        id: "cook", title: "4 · Cook", multi: true, optional: true,
        intro: "Three main energy paths: gas, fire, electricity. Biogas turns your waste into cooking fuel.",
        options: [
          o("gas", "Gas / biogas stove", "Cheap bottles, or make methane from waste in a biodigester.", 100, ["diyfav"], "Propane/butane stoves are simple, powerful, and instant. A biogas digester turns organic waste into methane for cooking. Free fuel from your own waste."),
          o("rocket", "Rocket / wood cook stove", "Up to ~70% wood savings, clean burn, thermal mass.", 180, ["diyfav"], "A rocket stove burns small sticks with incredible efficiency (90%+ combustion). Much less smoke than an open fire. The thermal mass design (cob surround) retains heat for hours."),
          o("solarcook", "Solar cooker", "Free, slow, sun-tracking. Great for the dry season.", 120, [], "A parabolic or box cooker reaches 100-150C using only sunlight. Free cooking but weather-dependent and slow. Best as a secondary option for sunny days."),
          o("electric", "Electric (Norwegian pot)", "Insulated pot + element cooks for hours on little power.", 90, ["needsPower"], 'An insulated electric pot (the "Norwegian pot" or "Wonderbag" concept) uses ~100W and cooks over hours. Very efficient — slow cooking with minimal power.' ),
        ],
      },
    ],
  },
};

const THEMATIC_ORDER = ["electricity", "water", "food"];

/* ----------------------------------------------------- MYSTERY CARDS ------ */
/* Each: trigger(h) -> bool. h.has(th,step,id), h.any, h.count, h.climate, h.setup, h.tier */
const COLD = ["boreal", "alpine"];
const DRY = ["arid", "mediterranean"];
const SALTY = ["tropics", "maritime"];

const CARDS = [
  { id: "delam", sev: "warn", title: "Two panels delaminated", color: C.power,
    trigger: (h) => hasSolar(h) && SALTY.includes(h.climate),
    body: "Eight months in, two of your salvaged panels bubble and delaminate under relentless UV and salt air — just like a real case in coastal Florida where a DIYer lost 12 of 16 panels to golf-ball-sized hail the following spring.",
    lesson: "In salty/UV climates, salvaged panels age fast — and a single hail storm can wipe you out. Choose panels rated Class 4 for hail, install at steep angles to shed debris, and keep spares. A ground-mount is more exposed than roof — factor that in." },

  { id: "altcook", sev: "bad", title: "The alternator cooked the pack", color: C.power,
    trigger: (h) => h.has("electricity", "genint", "alternator") && hasLithium(h),
    body: "You belt-charge the LiFePO4 bank off the engine alternator. It pulls hard and never lets up — the alternator overheats and burns out. This exact failure happens in DIY van builds every year.",
    lesson: "LiFePO4 has huge charge-acceptance: it won't tell the alternator to stop. A 100Ah lithium bank can pull 200A+ from a 120A-rated alternator until it smokes. Use a DC-DC charger (Victron Orion, Renogy) that limits current and has temperature protection." },

  { id: "deepdischarge", sev: "bad", title: "Bank murdered overnight", color: C.power,
    trigger: (h) => h.has("electricity", "battery", "lead") && !h.has("electricity", "optimize", "shunt"),
    body: "A cloudy stretch, no monitor, and you draw the lead-acid bank flat. A real Saskatchewan off-gridder lost 50% of battery capacity in one winter exactly this way.",
    lesson: "Lead-acid below 50% DoD causes irreversible sulfation — below 30% and the plates are permanently damaged. Without a shunt you're flying blind. Install a battery monitor (Victron BMV $80) and never discharge below 50% for longevity." },

  { id: "lifepo4cold", sev: "warn", title: "BMS blocked charging - it's freezing", color: C.power,
    trigger: (h) => hasLithium(h) && COLD.includes(h.climate),
    body: "Winter morning in Montana, sun blazing — but your BMS refuses the charge. LiFePO4 below 0°C cannot be charged without plating lithium metal. The bank sits dead empty in the cold.",
    lesson: "Real Canadian off-gridders have been stranded by this. Solutions: self-heating batteries (Battle Born heated), keep bank in an insulated/heated enclosure, switch to LTO or sodium-ion which tolerate -20°C, or use a small heating pad powered by a separate low-voltage circuit." },

  { id: "onesource", sev: "warn", title: "A cloudy week, everything dark", color: C.power,
    trigger: (h) => h.count("electricity", "generate") === 1 && hasSolar(h),
    body: "Five grey days in a row. Solar-only, the bank crawls toward empty. You're rationing the fridge and Starlink — the same mistake a Michigan family made during a winter with only 4 hours of weak daily sun.",
    lesson: "Winter solar output is 10-25% of summer in northern climates. Size for the worst week, not the best day. Add wind (which produces more in winter), hydro, or at minimum double your panel count for December." },

  { id: "hydrodry", sev: "warn", title: "The river dropped", color: C.power,
    trigger: (h) => h.has("electricity", "generate", "hydro") && DRY.includes(h.climate) && h.count("electricity", "generate") === 1,
    body: "Dry season hits and the river's flow halves. Your hydro output craters — just like California ranchers whose streams disappeared during drought, burning out pumps that ran dry.",
    lesson: "A California family's well pump melted when the water table dropped 40 feet below the intake — no dry-run sensor installed. Always install a dry-run protection sensor. Monitor seasonal water levels and pair hydro with solar." },

  { id: "invsurge", sev: "warn", title: "Grinder tripped the inverter", color: C.power,
    trigger: (h) => h.has("electricity", "inverter", "inv_1000") && h.has("food", "preserve", "dcfridge"),
    body: "You fire up an angle grinder; its startup surge spikes past your 1000W inverter and it cuts out mid-cut.",
    lesson: "A 900W grinder needs 2500W+ surge to start. Size inverter at 1.25-1.5x your biggest tool's SURGE rating, not running watts. Better: use brushless DC tools that draw 60% less and run off battery." },

  { id: "genfail", sev: "warn", title: "Generator won't start", color: C.power,
    trigger: (h) => hasBackup(h),
    body: "Cloudy week, you're at 30% battery. You pull the generator cord. Nothing. Carburetor's gummed up from ethanol gas that went bad months ago.",
    lesson: "Real Oregon homesteaders learned: ethanol gas degrades in 30 days. Use ethanol-free gas + stabilizer (Sta-Bil), run the carburetor dry before storage, or convert to propane with a dual-fuel kit — propane never goes bad. An untested backup isn't a backup." },

  { id: "streamclog", sev: "warn", title: "Something died upstream", color: C.water,
    trigger: (h) => h.has("water", "collect", "streamdirect") && !h.has("water", "collect", "streambox"),
    body: "After heavy rain, your direct river intake clogs. While clearing it, you find a dead animal carcass upstream. The whole line needs flushing — two days without water.",
    lesson: "A Vermont family got giardia from a direct stream intake. Buried intake boxes filter through gravel before water enters the pipe — worth the extra $170. Always stack filtration: intake box + prefilter + UV or boil." },

  { id: "raindrought", sev: "bad", title: "Three weeks, no rain", color: C.water,
    trigger: (h) => h.has("water", "collect", "rain") && DRY.includes(h.climate) && !(h.has("water", "collect", "borewell") || h.has("water", "collect", "ro") || h.has("water", "collect", "ground")),
    body: "A long dry spell and the rain tanks run dry. Rain was your only source — now you're hauling 5-gallon jugs from 30 miles away.",
    lesson: "A first-year off-gridder's classic mistake: translucent tank grew algae within three months because sunlight penetrated. Use opaque dark tanks, install a first-flush diverter, and always pair rain with groundwater or another source." },

  { id: "watersingle", sev: "warn", title: "Your only source failed", color: C.water,
    trigger: (h) => h.count("water", "collect") === 1,
    body: "Your single water source goes down for a week. Pump failure, drought, contamination — doesn't matter. No backup means no water. The most stressful off-grid failure there is.",
    lesson: "The #1 rule from every long-term off-gridder: three sources minimum. Well (electric), rainwater (gravity), stream (manual backup). If one fails you have time to fix it. If your only source is electric, the day the battery dies your tap dies too." },

  { id: "rofoul", sev: "warn", title: "RO membrane fouled", color: C.water,
    trigger: (h) => h.has("water", "collect", "ro") && !h.any("water", "filter"),
    body: "Your reverse-osmosis desalinator stops producing. Without a prefilter, sediment and chlorine destroyed the membrane in months. A $500 replacement that takes weeks to ship.",
    lesson: "Marine RO users know: membranes are chlorine-sensitive and fragile. Always prefilter with sediment + carbon block and flush with fresh water after every use. A backup hand-pump or solar still avoids total dependency." },

  { id: "nopurify", sev: "bad", title: "Everyone got sick", color: C.water,
    trigger: (h) => h.any("water", "collect") && !h.any("water", "filter"),
    body: "You've been drinking collected water unfiltered. Three days of stomach cramps and fever — giardia doesn't care about your timeline.",
    lesson: "Stack filtration: prefilter (sediment) + ceramic/carbon (pathogens) + UV or boil (viruses). No single method catches everything. A Sawyer squeeze ($40) + SteriPEN ($100) + boiled backup = safe from almost any source." },

  { id: "powerlesswater", sev: "warn", title: "No power, no water", color: C.water,
    trigger: (h) => (h.has("water", "move", "pump12") || h.has("water", "move", "pumpac")) && !(h.has("water", "move", "gravity") || h.has("water", "move", "ram") || h.has("water", "move", "manual")),
    body: "Your electric pump is the only way water moves — and the day the battery dies, so does your tap.",
    lesson: "Real off-gridders couple electric pumps with gravity or manual backup. A 12V Shurflo pump ($150) is great until the bank dies. A manual hand pump ($200) on the same well is cheap insurance. Elevated secondary tank for gravity feed = zero power needed." },

  { id: "fridgedrain", sev: "warn", title: "The fridge ate the bank", color: C.power,
    trigger: (h) => h.has("food", "preserve", "dcfridge") && (h.has("electricity", "battery", "lead_100ah") || h.count("electricity", "generate") === 1),
    body: "Your DC fridge is the single biggest load — an Arizona couple's old compressor fridge drained batteries before dawn every night, consuming 3x what they expected.",
    lesson: "A 12V chest fridge can draw 50-80 Ah/day — typically your #1 consumer. Test actual usage with a Kill-A-Watt. Insulate the box with an extra blanket in winter. Set thermostat one degree warmer (saves 10-15%). Propane fridges use zero electricity." },

  { id: "coopraid", sev: "bad", title: "The coop got raided", color: C.food,
    trigger: (h) => h.has("food", "grow", "animals") && (h.has("electricity", "community", "none") || (!h.has("electricity", "detect", "dog") && !h.has("electricity", "harden", "door"))),
    body: "A predator — two- or four-legged — cleans out your chickens overnight. No dog barked. No alarm. A year of eggs gone in one night.",
    lesson: "Real homesteaders lose entire flocks to raccoons, foxes, even bears. Use hardware cloth (NOT chicken wire — that stops nothing), a motion light, and a guardian dog. One Tennessee family had a 10-foot black bear open their coop door like a latch expert." },

  { id: "cropheat", sev: "warn", title: "Heat wave wilted the garden", color: C.food,
    trigger: (h) => (h.has("food", "grow", "beds") || h.has("food", "controlled", "hydro")) && DRY.includes(h.climate) && !h.has("food", "grow", "earthworks") && !h.has("water", "use", "greywater"),
    body: "A scorching dry week and the beds wilt — your food plan never tied into a water plan. The plants needed 5x normal water.",
    lesson: "Food and water are one system. Swales catch rainwater and recharge groundwater. Greywater irrigates fruit trees. Mulch 4-6 inches deep cuts evaporation by 70%. A 250sqft garden needs 25+ gal/day in hot weather — plan for it." },

  { id: "nohelp", sev: "bad", title: "Break-in, no way to call out", color: C.sec,
    trigger: (h) => (h.has("electricity", "community", "none") || !h.any("electricity", "community")) && !h.any("electricity", "internet") && !h.any("electricity", "localcomms"),
    body: "An intrusion at 2am. No radio, no neighbour net, no way to call for help. The nearest town is 45 minutes away. Isolation cuts both ways.",
    lesson: "A real Sierra Nevada cabin was burglarized for $2,400 in batteries — thieves cut a padlock and loaded a truck. Install a cellular security cam, hardened battery box locks, and a Meshtastic LoRa node ($80) for off-grid text communication over kilometers." },

  { id: "elecfire", sev: "bad", title: "Fire in the battery box", color: C.sec,
    trigger: (h) => h.any("electricity", "generate") && !h.has("electricity", "wiring", "breakers") && !h.has("electricity", "fire", "fireball"),
    body: "A loose battery terminal arcs, igniting stored cardboard nearby. The shed fills with toxic smoke — fire department is 35 minutes out.",
    lesson: "This exact fire happened in rural Colorado: a loose 12V terminal created resistance, arced, and ignited boxes stored nearby. Torque terminals to spec (6-8 Nm), use anti-corrosion washers, mount a fire extinguisher inside the battery enclosure, and NEVER store combustibles near batteries." },

  { id: "saltcorrosion", sev: "warn", title: "Salt ate your connections", color: C.power,
    trigger: (h) => h.climate === "maritime" && h.any("electricity", "generate"),
    body: "Months of salt air corrode terminals and crimps. Voltage drops, circuits go intermittent, one morning your pump won't start — but the battery is full. Salt ate your connections.",
    lesson: "Use tinned marine-grade wire, dielectric grease on all connections, and stainless hardware. Inspect every 3 months. A can of Corrosion-X ($12) sprayed annually on all electrical connections is the difference between reliable and stranded." },

  /* Good cards — reward resilient builds */
  { id: "resilientwater", sev: "good", title: "Resilient water - well done", color: C.water,
    trigger: (h) => h.count("water", "collect") >= 3 && h.any("water", "filter"),
    body: "Three+ sources and stacked filtration. A drought, a pump failure and a contamination event all hit this year — and you never ran dry or got sick. Just like the Hawaii homestead with 50,000 gallons of rainwater catchment and redundant pumps.",
    lesson: "This is what resilience looks like. A real Hawaii family weathered a 3-week volcanic smog event that cut all road access — they had ample water and power because they overbuilt. Redundancy isn't expensive; it's what lets you sleep through the storm." },

  { id: "resilientpower", sev: "good", title: "Two sources saved you", color: C.power,
    trigger: (h) => h.count("electricity", "generate") >= 2 && h.has("electricity", "wiring", "monitor"),
    body: "A grey week knocked out solar — but your second source carried the load. The battery monitor kept you from panicking. You barely noticed the lack of sun.",
    lesson: "A Maine family with 2kW solar + 10kWh battery + wood stove rode out a 10-day ice storm that left the entire grid dead. They sized for winter, practiced load-shedding (pump only during solar hours), and had integrated backup. Their grid-tied neighbors had nothing." },
];

/* ----------------------------------------------------- SEASON / MONTH UTILS ------ */

const MONTHS = [
  { name: "January", days: 31, temp: "cold" },
  { name: "February", days: 28, temp: "cold" },
  { name: "March", days: 31, temp: "cool" },
  { name: "April", days: 30, temp: "mild" },
  { name: "May", days: 31, temp: "warm" },
  { name: "June", days: 30, temp: "warm" },
  { name: "July", days: 31, temp: "hot" },
  { name: "August", days: 31, temp: "hot" },
  { name: "September", days: 30, temp: "mild" },
  { name: "October", days: 31, temp: "cool" },
  { name: "November", days: 30, temp: "cold" },
  { name: "December", days: 31, temp: "cold" },
];

function getSeason(month) {
  if (month < 2 || month === 11) return "winter";
  if (month < 5) return "spring";
  if (month < 8) return "summer";
  return "fall";
}

function getSeasonEmoji(season) {
  return { spring: "🌸", summer: "☀️", fall: "🍂", winter: "❄️" }[season] || "🌿";
}

function getTempEmoji(temp) {
  return { cold: "🥶", cool: "🌬️", mild: "🌤️", warm: "☀️", hot: "🔥" }[temp] || "🌡️";
}

function getSeasonColor(season) {
  return { spring: "#6BBF59", summer: "#F2C14E", fall: "#C97A3A", winter: "#7BAAC8" }[season] || C.faint;
}

/* Compute resource impact from a card */
function getCardImpact(card) {
  let resource;
  if (card.color === C.water) resource = "water";
  else if (card.color === C.food) resource = "food";
  else if (card.color === C.sec) resource = "security";
  else resource = "battery";

  let amount;
  if (card.sev === "good") amount = 15 + Math.floor(Math.random() * 10);
  else if (card.sev === "bad") amount = -(20 + Math.floor(Math.random() * 15));
  else amount = -(8 + Math.floor(Math.random() * 10));

  return { resource, amount, scoreImpact: card.sev === "good" ? 10 : card.sev === "bad" ? -15 : -5 };
}

/* Monthly decay rates based on setup quality */
function getDecay(H, climate) {
  const isCold = ["boreal", "alpine"].includes(climate);
  const isDry = ["arid", "mediterranean"].includes(climate);
  const isTropical = climate === "tropics";

  // Electricity / battery
  const genCount = H.count("electricity", "generate");
  const hasSolarLocal = hasSolar(H);
  const hasHydro = H.has("electricity", "generate", "hydro");
  const hasWind = H.has("electricity", "generate", "wind");
  const hasGensetLocal = hasBackup(H);
  const hasMonitor = H.has("electricity", "wiring", "monitor");
  const hasBattery = H.any("electricity", "battery");
  const isLithium = hasLithium(H);
  const winterPenalty = isCold ? 2.5 : 0; // Winter = way less solar
  const cloudPenalty = isTropical ? 1.0 : 0; // Tropical = cloudy season
  const genBonus = genCount * 0.4; // Each source helps
  const solarOnlyPenalty = genCount === 1 && hasSolarLocal ? 1.5 : 0; // Solar-only suffers
  const hydroBonus = hasHydro ? 1.0 : 0; // Hydro runs 24/7
  const efficientBonus = (hasMonitor || H.has("electricity","wiring","pv_wire")) ? 0.8 : 0;
  const lithiumBonus = isLithium ? 0.3 : 0; // Lithium has more usable capacity
  const batteryDebt = !hasBattery ? 5.0 : 0; // No battery = near-impossible

  const batteryDecay = Math.max(0.5, 6.0 + winterPenalty + cloudPenalty - genBonus + solarOnlyPenalty - hydroBonus - efficientBonus - lithiumBonus + batteryDebt);

  // Water
  const waterCount = H.count("water", "collect");
  const hasGravity = H.has("water", "move", "gravity");
  const hasRam = H.has("water", "move", "ram");
  const hasManual = H.has("water", "move", "manual");
  const hasElectricPump = H.has("water", "move", "pump12") || H.has("water", "move", "pumpac");
  const hasStorage = H.any("water", "store");
  const hasFilter = H.any("water", "filter");
  const dryPenalty = isDry ? 3.0 : 0;
  const sourceBonus = waterCount * 0.3;
  const gravityBonus = hasGravity ? 1.5 : 0; // Gravity = no power needed, reliable
  const manualBonus = hasManual ? 0.5 : 0; // Manual is reliable
  const storageBonus = hasStorage ? 0.5 : 0;
  const filterBonus = hasFilter ? 0.3 : 0; // Filtering = safer water, less waste
  const pumpPenalty = hasElectricPump && !hasGravity && !hasManual ? 1.5 : 0; // Only electric = fragile

  const waterDecay = Math.max(0.5, 4.0 + dryPenalty - sourceBonus - gravityBonus - manualBonus - storageBonus - filterBonus + pumpPenalty);

  // Food
  const hasGrow = H.any("food", "grow");
  const hasControlled = H.any("food", "controlled");
  const hasPreserve = H.any("food", "preserve");
  const hasCook = H.any("food", "cook");
  const hasFridge = H.has("food", "preserve", "dcfridge");
  const hasCellar = H.has("food", "preserve", "cellar");
  const hasJars = H.has("food", "preserve", "jars");
  const hasChickens = H.has("food", "grow", "animals");

  const foodGrowScore = hasGrow ? 1.5 : 0;
  const controlledScore = hasControlled ? 0.8 : 0;
  const preserveScore = hasCellar ? 1.0 : hasFridge ? 0.6 : hasJars ? 0.4 : 0;
  const chickensScore = hasChickens ? 0.5 : 0;
  const foodDecay = Math.max(0.5, 3.5 - foodGrowScore - controlledScore - preserveScore - chickensScore);

  // Security
  const hasDetect = H.any("electricity", "detect");
  const hasHarden = H.any("electricity", "harden");
  const hasFire = H.any("electricity", "fire");
  const hasCommunity = H.any("electricity", "community");
  const hasCameras = H.has("electricity", "detect", "cameras");
  const hasDog = H.has("electricity", "detect", "dog");

  const detectScore = hasDog ? 1.0 : hasCameras ? 0.8 : hasDetect ? 0.5 : 0;
  const hardenScore = hasHarden ? 0.7 : 0;
  const fireScore = hasFire ? 1.0 : 0;
  const communityScore = hasCommunity ? 0.5 : 0;
  const securityDecay = Math.max(0.2, 2.5 - detectScore - hardenScore - fireScore - communityScore);

  return {
    battery: batteryDecay,
    water: waterDecay,
    food: foodDecay,
    security: securityDecay,
  };
}

/* --------------------------------------------------------------- UI BITS -- */

function Tag({ children, bg, fg }) {
  return (
    <span style={{ background: bg, color: fg, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.5, padding: "0 8px 0 8px", paddingTop: 2, paddingBottom: 2, borderRadius: 4, textTransform: "uppercase" }}>{children}</span>
  );
}

/* ---- Improved SceneSVG with trees, mountains, weather per climate/setup ---- */
function SceneSVG({ setup, climate, color, season, sel }) {
  const sky = climate === "boreal" || climate === "alpine" ? "#2A3340"
    : climate === "arid" ? "#3A2E1F"
      : climate === "maritime" ? "#26303A" : "#243024";
  // Seasonal sky tint
  const seasonTint = season === "spring" ? "rgba(107,191,89,0.08)"
    : season === "summer" ? "rgba(242,193,78,0.12)"
    : season === "fall" ? "rgba(201,122,58,0.10)"
    : season === "winter" ? "rgba(123,170,200,0.10)"
    : "transparent";
  const ground = climate === "arid" ? "#5C4326" : climate === "boreal" ? "#3A4450" : "#2E3A26";
  const groundSeason = season === "winter" ? "#3A3A45"
    : season === "fall" ? "#3A3526"
    : season === "spring" ? "#2E3A26"
    : ground;
  const water = setup === "catamaran";
  const isCold = climate === "boreal" || climate === "alpine";
  const isDry = climate === "arid";
  const isTropical = climate === "tropics";

  const snowline = isCold ? 155 : null;
  const mountains = climate === "alpine" || climate === "boreal";
  const trees = !isDry && !mountains;
  const palm = isTropical;
  const cactus = isDry;
  const rain = climate === "maritime" || climate === "tropics";
  const snow = isCold;
  const sunBeams = isDry || climate === "mediterranean";

  return (
    <svg viewBox="0 0 400 220" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor={C.ink} />
        </linearGradient>
        <linearGradient id="sunRays" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.power} stopOpacity="0.25" />
          <stop offset="1" stopColor={C.power} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mountGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3344" />
          <stop offset="1" stopColor="#282231" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="220" fill="url(#sk)" />

      {/* Weather: rain drops */}
      {rain && Array.from({ length: 20 }).map((_, i) => (
        <line key={"rain" + i} x1={10 + (i * 19) % 390} y1={5 + (i * 7) % 50} x2={6 + (i * 19) % 390} y2={10 + (i * 7) % 50} stroke={C.water} strokeWidth="1" opacity="0.5" />
      ))}

      {/* Weather: snow flakes */}
      {snow && Array.from({ length: 25 }).map((_, i) => (
        <circle key={"snow" + i} cx={10 + (i * 17) % 390} cy={3 + (i * 9) % 80} r={1.5} fill={C.bone} opacity={0.4 + (i % 3) * 0.2} />
      ))}

      {/* Mountains (alpine/boreal) */}
      {mountains && (
        <g>
          <path d="M0 160 L60 60 L120 160 Z" fill="url(#mountGrad)" opacity="0.7" />
          <path d="M80 160 L150 40 L220 160 Z" fill="url(#mountGrad)" opacity="0.6" />
          <path d="M180 160 L260 55 L340 160 Z" fill="url(#mountGrad)" opacity="0.5" />
          {/* Snowcaps */}
          <path d="M55 68 L60 60 L65 68 Z" fill={C.bone} opacity="0.8" />
          <path d="M143 48 L150 40 L157 48 Z" fill={C.bone} opacity="0.8" />
          <path d="M252 62 L260 55 L268 62 Z" fill={C.bone} opacity="0.8" />
        </g>
      )}

      {/* Animated sun — moves with seasons (higher in summer, lower in winter) */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values={season === "winter" ? "0,15" : season === "fall" ? "0,8" : season === "spring" ? "0,3" : "0,0"}
          dur="4s" repeatCount="indefinite" />
        <circle cx="320" cy={season === "winter" ? 60 : season === "fall" ? 52 : season === "spring" ? 46 : 42} r="20" fill={C.power} opacity="0.9" />
      </g>

      {/* Sun rays for arid/mediterranean */}
      {sunBeams && (
        <>
          <circle cx="320" cy="46" r="28" fill="none" stroke={C.power} strokeWidth="1" opacity="0.15" />
          <circle cx="320" cy="46" r="36" fill="none" stroke={C.power} strokeWidth="0.5" opacity="0.1" />
          <polygon points="320,10 322,18 318,18" fill={C.power} opacity="0.3" />
          <polygon points="345,25 348,32 341,30" fill={C.power} opacity="0.3" />
          <polygon points="295,25 298,30 291,32" fill={C.power} opacity="0.3" />
          <polygon points="335,60 340,58 338,64" fill={C.power} opacity="0.25" />
          <polygon points="300,55 297,60 303,58" fill={C.power} opacity="0.25" />
        </>
      )}

      {/* Seasonal tint overlay */}
      {season && season !== "summer" && (
        <rect x="0" y="0" width="400" height="220" fill={seasonTint} />
      )}

      {/* ground or sea */}
      <rect x="0" y="160" width="400" height="60" fill={water ? "#1E3A47" : groundSeason} />
      {water && <path d="M0 168 Q 50 162 100 168 T 200 168 T 300 168 T 400 168 V220 H0 Z" fill="#27495A" opacity="0.6" />}
      {water && <path d="M0 175 Q 60 170 120 175 T 240 175 T 360 175 T 400 175" fill="none" stroke="#3A6A7A" strokeWidth="1" opacity="0.4" />}

      {/* Snow cover on ground */}
      {snowline && (
        <rect x="0" y={snowline} width="400" height="5" fill={C.bone} opacity="0.3" rx="2" />
      )}
      {season === "winter" && !snowline && (
        <rect x="0" y="158" width="400" height="4" fill={C.bone} opacity="0.2" rx="2" />
      )}

      {/* Spring flowers */}
      {season === "spring" && !isDry && (
        <>
          {[30, 80, 320, 370, 140, 260].map((cx, i) => (
            <g key={"flower" + i}>
              <line x1={cx} y1="162" x2={cx} y2="155" stroke="#4A6A3A" strokeWidth="1" />
              <circle cx={cx} cy="154" r="2.5" fill={["#E86A6A","#E8C86A","#A86AE8","#E86AA8","#6AE8A8","#E8A86A"][i]} opacity="0.8" />
            </g>
          ))}
        </>
      )}

      {/* Fall leaves */}
      {season === "fall" && trees && (
        <>
          {[40, 100, 200, 300, 350].map((cx, i) => (
            <ellipse key={"leaf" + i} cx={cx} cy={130 + i * 8} rx={3} ry={2}
              fill={["#C97A3A","#B86A2A","#D88A4A","#A85A1A","#E89A5A"][i]} opacity={0.6 + (i % 3) * 0.1}
              transform={`rotate(${i * 30} ${cx} ${130 + i * 8})`} />
          ))}
        </>
      )}

      {/* structure */}
      {setup === "catamaran" && (
        <g>
          <path d="M150 168 h110 l-14 18 h-82 z" fill="#3A3322" stroke={C.line} />
          <rect x="170" y="120" width="70" height="48" fill="#2C2618" stroke={C.line} />
          {/* Mast & sail */}
          <line x1="205" y1="120" x2="205" y2="70" stroke={C.mute} strokeWidth="2" />
          <path d="M205 74 l34 40 h-34 z" fill={C.bone} opacity="0.85" />
          {/* Flag */}
          <polygon points="205,70 225,75 205,80" fill={C.over} opacity="0.7" />
        </g>
      )}
      {setup === "van" && (
        <g>
          <rect x="150" y="124" width="110" height="44" rx="6" fill="#2C2618" stroke={C.line} />
          <rect x="232" y="116" width="28" height="20" fill="#2C2618" stroke={C.line} />
          <circle cx="172" cy="170" r="9" fill="#181610" stroke={C.mute} />
          <circle cx="240" cy="170" r="9" fill="#181610" stroke={C.mute} />
          {/* Roof rack hint */}
          <line x1="155" y1="124" x2="155" y2="116" stroke={C.mute} strokeWidth="2" opacity="0.5" />
          <line x1="255" y1="124" x2="255" y2="116" stroke={C.mute} strokeWidth="2" opacity="0.5" />
          <line x1="155" y1="116" x2="255" y2="116" stroke={C.mute} strokeWidth="2" opacity="0.5" />
        </g>
      )}
      {(setup === "stonecabin" || setup === "earthship" || setup === "tinyhouse" || setup === "homestead" || setup === "yurt") && (
        <g>
          {/* Structure body */}
          <rect x="160" y="120" width="92" height="48" fill="#2C2618" stroke={C.line} />
          {/* Roof */}
          {setup === "yurt"
            ? <path d="M150 120 q56 -34 112 0 z" fill="#3A3322" stroke={C.line} />
            : <path d="M152 120 l54 -28 54 28 z" fill="#3A3322" stroke={C.line} />}
          {/* Door */}
          <rect x="198" y="142" width="18" height="26" fill="#181610" />
          {/* Chimney for cabin */}
          {setup === "stonecabin" && (
            <>
              <rect x="230" y="98" width="8" height="22" fill="#3A3322" />
              <path d="M231 98 q2 -6 6 0" fill="none" stroke={C.faint} strokeWidth="1.5" opacity="0.6" />
            </>
          )}
          {/* Window for tiny house */}
          {setup === "tinyhouse" && (
            <rect x="172" y="132" width="14" height="14" fill="#181610" stroke={C.mute} strokeWidth="0.5" />
          )}
          {/* Porch for homestead */}
          {setup === "homestead" && (
            <line x1="160" y1="168" x2="160" y2="176" stroke={C.mute} strokeWidth="2" />
          )}
        </g>
      )}

      {/* Trees and vegetation */}
      {trees && (
        <>
          {/* Pine trees */}
          {[20, 45, 365, 385].map((cx, i) => (
            <g key={"pine" + i}>
              <rect x={cx - 1.5} y="150" width="3" height="12" fill="#3A3322" />
              <polygon points={`${cx},140 ${cx - 12},160 ${cx + 12},160`} fill={C.food} opacity="0.7" />
              <polygon points={`${cx},144 ${cx - 8},158 ${cx + 8},158`} fill={C.food} opacity="0.85" />
            </g>
          ))}
          {/* Deciduous tree */}
          <g>
            <rect x="325" y="140" width="3" height="20" fill="#3A3322" />
            <circle cx="327" cy="135" r="14" fill={C.food} opacity="0.6" />
            <circle cx="320" cy="140" r="10" fill={C.food} opacity="0.5" />
            <circle cx="334" cy="138" r="9" fill={C.food} opacity="0.55" />
          </g>
        </>
      )}

      {/* Palm trees for tropics */}
      {palm && (
        <>
          {[30, 375].map((cx, i) => (
            <g key={"palm" + i}>
              <path d={`M${cx} 150 Q${cx - 3} 130 ${cx} 110`} fill="none" stroke="#3A3322" strokeWidth="3" />
              <path d={`M${cx} 110 Q${cx - 15} 100 ${cx - 18} 105 Q${cx - 10} 108 ${cx} 110`} fill={C.food} opacity="0.8" />
              <path d={`M${cx} 110 Q${cx + 15} 100 ${cx + 18} 105 Q${cx + 10} 108 ${cx} 110`} fill={C.food} opacity="0.8" />
              <path d={`M${cx} 110 Q${cx - 5} 95 ${cx - 8} 100 Q${cx - 3} 104 ${cx} 110`} fill={C.food} opacity="0.75" />
              <path d={`M${cx} 110 Q${cx + 5} 95 ${cx + 8} 100 Q${cx + 3} 104 ${cx} 110`} fill={C.food} opacity="0.75" />
              {/* Coconuts */}
              <circle cx={cx - 2} cy={112} r={2} fill="#5C4326" />
              <circle cx={cx + 2} cy={113} r={2} fill="#5C4326" />
            </g>
          ))}
        </>
      )}

      {/* Cacti for arid */}
      {cactus && (
        <>
          {[25, 378].map((cx, i) => (
            <g key={"cactus" + i}>
              <rect x={cx - 3} y="130" width="6" height="30" rx="3" fill="#4A6A3A" />
              <path d={`M${cx - 3} 140 Q${cx - 12} 138 ${cx - 12} 133 Q${cx - 8} 130 ${cx - 3} 138`} fill="#4A6A3A" />
              <path d={`M${cx + 3} 142 Q${cx + 12} 140 ${cx + 12} 135 Q${cx + 8} 132 ${cx + 3} 140`} fill="#4A6A3A" />
            </g>
          ))}
          {/* Small desert bushes */}
          <ellipse cx="350" cy="155" rx="6" ry="3" fill="#5A5A30" opacity="0.6" />
          <ellipse cx="60" cy="158" rx="5" ry="3" fill="#5A5A30" opacity="0.6" />
        </>
      )}

      {/* Bushes for temperate/mediterranean */}
      {(climate === "temperate" || climate === "mediterranean") && (
        <>
          <ellipse cx="40" cy="158" rx="10" ry="4" fill={C.food} opacity="0.5" />
          <ellipse cx="360" cy="156" rx="8" ry="3" fill={C.food} opacity="0.4" />
          <ellipse cx="90" cy="160" rx="6" ry="2" fill={C.food} opacity="0.3" />
          <ellipse cx="310" cy="160" rx="7" ry="3" fill={C.food} opacity="0.35" />
        </>
      )}

      {/* Solar panels */}
      <g stroke={C.ink} strokeWidth="1">
        <g transform="translate(70,150) rotate(-12)">
          <rect x="0" y="0" width="54" height="30" fill={color} opacity="0.85" />
          <line x1="18" y1="0" x2="18" y2="30" /><line x1="36" y1="0" x2="36" y2="30" />
          <line x1="0" y1="15" x2="54" y2="15" />
        </g>
        <g transform="translate(290,150) rotate(12)">
          <rect x="0" y="0" width="54" height="30" fill={color} opacity="0.85" />
          <line x1="18" y1="0" x2="18" y2="30" /><line x1="36" y1="0" x2="36" y2="30" />
          <line x1="0" y1="15" x2="54" y2="15" />
        </g>
      </g>
      {/* Starlink dish (if user selected comms) */}
      {sel && (sel.electricity?.internet?.includes("starlink") || sel.electricity?.internet === "starlink") && (
        <g transform="translate(38,110)">
          <rect x="0" y="0" width="32" height="6" rx="2" fill="#2A2A2A" stroke={C.mute} strokeWidth="0.5" />
          <line x1="16" y1="6" x2="16" y2="18" stroke={C.mute} strokeWidth="1" />
          <rect x="8" y="18" width="16" height="10" rx="2" fill="#1A1A1A" stroke={C.mute} strokeWidth="0.5" />
        </g>
      )}

      {/* LTE/cell antenna */}
      {sel && (sel.electricity?.internet?.includes("lte") || sel.electricity?.internet === "lte") && (
        <g transform="translate(350,85)">
          <line x1="0" y1="0" x2="0" y2="25" stroke={C.mute} strokeWidth="1.5" />
          <line x1="0" y1="0" x2="6" y2="5" stroke={C.mute} strokeWidth="1" />
          <line x1="0" y1="4" x2="6" y2="9" stroke={C.mute} strokeWidth="1" />
          <line x1="0" y1="8" x2="6" y2="13" stroke={C.mute} strokeWidth="1" />
          <rect x="-3" y="25" width="6" height="6" rx="1" fill="#1A1A1A" stroke={C.mute} strokeWidth="0.5" />
        </g>
      )}

      {/* Security cameras — count based on detection choices */}
      {sel && (() => {
        const detect = sel.electricity?.detect || [];
        const ids = Array.isArray(detect) ? detect : [detect];
        const hasCameras = ids.includes("cameras");
        const hasMotion = ids.includes("motion");
        const hasFiber = ids.includes("fiber");
        const hasDrone = ids.includes("drone");
        let camCount = hasCameras ? 3 : 0;
        if (hasFiber) camCount += 1;
        if (hasDrone) camCount += 1;
        if (hasMotion && camCount < 3) camCount = Math.max(camCount, 1);
        if (camCount === 0) return null;
        const positions = [[260,95], [320,90], [30,100], [370,100], [80,105], [180,100], [340,108], [130,95], [50,95]];
        const count = Math.min(camCount, 9);
        return (
          <g>
            {positions.slice(0, count).map(([cx, cy], i) => (
              <g key={"cam" + i}>
                <rect x={cx-3} y={cy-2} width="6" height="8" rx="1" fill="#1A1A1A" stroke={C.mute} strokeWidth="0.5" />
                <circle cx={cx} cy={cy-3} r="2.5" fill="#2A2A2A" stroke={C.over} strokeWidth="0.5" />
                <line x1={cx} y1={cy+6} x2={cx} y2={cy+12} stroke={C.mute} strokeWidth="0.5" />
                <circle cx={cx} cy={cy-3} r="1" fill={C.over} opacity={0.6 + (i % 3) * 0.2}>
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={1.5 + i * 0.3 + "s"} repeatCount="indefinite" />
                </circle>
              </g>
            ))}
          </g>
        );
      })()}

      {/* Equipment legend at bottom */}
      <text x="200" y="210" textAnchor="middle" fill={C.faint} style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1 }}>
        SCENE · {climate.toUpperCase()} / {setup.toUpperCase()}
      </text>
    </svg>
  );
}

/* ---- Generic Configurator: budget slider + choices + output box ---- */
/* Auto-generates a config for any option that doesn't have a custom one */
function autoConfig(op, tier) {
  const basePrice = op.p || 500;
  const tm = tier ? tier.mult : 1.0;
  return {
    budget: { min: Math.max(50, Math.round(basePrice * tm * 0.3 / 50) * 50), max: Math.max(1000, Math.round(basePrice * tm * 5 / 50) * 50), step: 50, def: Math.max(100, Math.round(basePrice * tm * 2 / 50) * 50) },
    choices: [
      { key: "cond", label: "Condition", opts: [
        { id: "used", l: "2nd-hand ×0.5", e: "Half the price, shorter lifespan, may have wear. Best for tight budgets or non-critical items." },
        { id: "new", l: "New ×1.0", e: "Full price, full warranty, best performance and longevity." }
      ]},
      { key: "qual", label: "Quality", opts: [
        { id: "budget", l: "Budget ×0.7", e: "Functional but basic. Fewer features, shorter warranty. Gets the job done." },
        { id: "standard", l: "Standard ×1.0", e: "Good quality, reliable, sensible balance of cost and performance." },
        { id: "premium", l: "Premium ×1.5", e: "Best materials, longest warranty, top performance. Worth it for critical systems." }
      ]}
    ],
    output: (v) => {
      const condMult = v.cond === "used" ? 0.5 : 1.0;
      const qualMult = v.qual === "budget" ? 0.7 : v.qual === "premium" ? 1.5 : 1.0;
      const effectivePrice = basePrice * tm * condMult * qualMult;
      const qty = Math.max(1, Math.floor(v._budget / effectivePrice));
      const spent = qty * effectivePrice;
      return {
        fields: [
          ["Quantity", qty + "x " + op.name],
          ["Quality", v.qual === "budget" ? "Budget" : v.qual === "premium" ? "Premium" : "Standard"],
          ["Condition", v.cond === "new" ? "New" : "Used"],
          ["Unit price", "$" + Math.round(effectivePrice / tm).toLocaleString() + " ×" + tm.toFixed(1)]
        ],
        spent: Math.round(spent),
        budget: v._budget
      };
    }
  };
}

function ConfigPanel({ op, cfg, setCfg, tier, color, remainingBudget, globalBudget }) {
  const config = op.config || autoConfig(op, tier);
  const c = config;
  const vals = cfg || { _budget: c.budget.def };
  const defaults = {};
  (c.choices || []).forEach((row) => { defaults[row.key] = row.opts[0].id; });
  const v = { ...defaults, ...vals, _budget: vals._budget || c.budget.def };

  const update = (key, val) => {
    setCfg((prev) => ({ ...(prev || {}), [key]: val }));
  };

  const result = c.output ? c.output(v) : { fields: [], spent: 0, budget: v._budget };

  const remainingBudgetVal = remainingBudget !== undefined ? remainingBudget : 0;

  return (
    <div style={{ marginTop: 8, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
      {/* Budget slider */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.mute, letterSpacing: 1 }}>BUDGET</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 14, color }}>${v._budget.toLocaleString()}</span>
        </div>
        <input type="range" min={c.budget.min} max={c.budget.max} step={c.budget.step} value={v._budget}
          onChange={(e) => { e.stopPropagation(); update("_budget", parseInt(e.target.value, 10)); }}
          style={{ width: "100%", height: 6, accentColor: color, cursor: "pointer" }} />
      </div>

      {/* Choice rows */}
      {(c.choices || []).map((row) => (
        <div key={row.key} style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.mute, letterSpacing: 1, marginRight: 4, alignSelf: "center", minWidth: 40 }}>{row.label}</span>
          {row.opts.map((opt) => (
            <button key={opt.id} onClick={(e) => { e.stopPropagation(); update(row.key, opt.id); }}
              title={opt.e || ""}
              style={{ background: v[row.key] === opt.id ? C.panel2 : "transparent", border: `1px solid ${v[row.key] === opt.id ? color : C.line}`, borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: v[row.key] === opt.id ? color : C.faint, fontSize: 10, fontFamily: FONT_MONO }}>
              {opt.l}
            </button>
          ))}
        </div>
      ))}

      {/* Output box */}
      {result.fields && result.fields.length > 0 && (
        <div style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, marginTop: 6 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.amber, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>What you get</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px", fontFamily: FONT_MONO, fontSize: 11 }}>
            {result.fields.map(([label, val], i) => (
              <React.Fragment key={i}>
                <span style={{ color: C.mute }}>{label}</span>
                <span style={{ color: C.bone, textAlign: "right" }}>{val}</span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 6, paddingTop: 4, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 10 }}>
            <span style={{ color: C.mute }}>${(result.budget || 0).toLocaleString()} budget</span>
            <span style={{ color }}>${(result.spent || 0).toLocaleString()} spent</span>
            {(result.budget && result.spent && result.budget > result.spent) && <span style={{ color: C.ok }}>${(result.budget - result.spent).toLocaleString()} left</span>}
            {(result.budget && result.spent && result.budget < result.spent) && <span style={{ color: C.over }}>${(result.spent - result.budget).toLocaleString()} over</span>}
          </div>
          {/* Feature 3: Budget cap warning */}
          {result.spent > 0 && remainingBudgetVal < result.spent && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: C.over + "22", border: `1px solid ${C.over}44`, borderRadius: 6, fontFamily: FONT_MONO, fontSize: 10, color: C.over, textAlign: "center" }}>
              ⚠️ ${(result.spent - remainingBudgetVal).toLocaleString()} over your ${(globalBudget || remainingBudgetVal + result.spent).toLocaleString()} budget
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- APP ------ */

export default function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | console | <thematic> | prompt
  const [cfg, setCfg] = useState({ climate: null, setup: null, budget: 8000, tier: "mid", mode: "diy" });
  const [sel, setSel] = useState(emptySel());
  const [openStepInfo, setOpenStepInfo] = useState({});
  const [cfgValues, setCfgValues] = useState({});
  const [cards, setCards] = useState(null); // null | array of firing cards
  const [cardIdx, setCardIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optionInfo, setOptionInfo] = useState({}); // { "tk-step-op": true/false }
  /* ---- YEAR SIMULATION STATE ---- */
  const [sim, setSim] = useState(null);
  // sim = { month: 0-11, phase: 'enter'|'decay'|'event'|'done', resources: {...}, score, schedule, currentEvent, eventVisible, prevResources }
  const [shareMsg, setShareMsg] = useState(null);

  function emptySel() {
    const s = {};
    THEMATIC_ORDER.forEach((k) => (s[k] = {}));
    return s;
  }

  const tier = TIERS[cfg.tier];
  const price = (opt) => Math.round((opt.p * tier.mult) / 5) * 5;

  /* Unified option cost calculator — uses configurator if available, falls back to flat price */
  function getOptionSpent(op) {
    const ac = op.config || autoConfig(op, tier);
    const v = cfgValues[op.id] || {};
    const defaults = {};
    (ac.choices || []).forEach((row) => { defaults[row.key] = row.opts[0].id; });
    const fullV = { ...defaults, ...v, _budget: v._budget || ac.budget.def };
    const r = ac.output ? ac.output(fullV) : { spent: 0 };
    return r.spent || price(op);
  }

  const spent = useMemo(() => {
    let total = 0;
    THEMATIC_ORDER.forEach((tk) => {
      const th = THEMATICS[tk];
      th.steps.forEach((st) => {
        const v = sel[tk][st.id];
        const ids = Array.isArray(v) ? v : v ? [v] : [];
        ids.forEach((id) => {
          const op = st.options.find((x) => x.id === id);
          if (op) total += getOptionSpent(op);
        });
      });
    });
    return total;
  }, [sel, cfg.tier, cfgValues]);

  const remaining = cfg.budget - spent;

  /* spending breakdown by thematic for bar chart — uses same method as spent */
  const breakdown = useMemo(() => {
    const b = {};
    THEMATIC_ORDER.forEach((tk) => {
      let total = 0;
      const th = THEMATICS[tk];
      th.steps.forEach((st) => {
        const v = sel[tk][st.id];
        const ids = Array.isArray(v) ? v : v ? [v] : [];
        ids.forEach((id) => {
          const op = st.options.find((x) => x.id === id);
          if (op) total += getOptionSpent(op);
        });
      });
      b[tk] = total;
    });
    return b;
  }, [sel, cfg.tier, cfgValues]);

  const spentTotal = THEMATIC_ORDER.reduce((s, tk) => s + breakdown[tk], 0);
  const remaining2 = Math.max(0, cfg.budget - spentTotal);

  /* helpers for relevance + cards */
  const H = useMemo(() => {
    const has = (tk, stp, id) => {
      const v = sel[tk]?.[stp];
      return Array.isArray(v) ? v.includes(id) : v === id;
    };
    const any = (tk, stp) => {
      const v = sel[tk]?.[stp];
      return Array.isArray(v) ? v.length > 0 : !!v;
    };
    const count = (tk, stp) => {
      const v = sel[tk]?.[stp];
      return Array.isArray(v) ? v.length : v ? 1 : 0;
    };
    return { has, any, count, climate: cfg.climate, setup: cfg.setup, tier: cfg.tier };
  }, [sel, cfg]);

  /* ---- loading transition ---- */
  const navigateTo = useCallback((nextScreen) => {
    setLoading(true);
    const id = setTimeout(() => {
      setScreen(nextScreen);
      setLoading(false);
    }, 350);
    return () => clearTimeout(id);
  }, []);

  function startBuild() {
    setSel(cfg.mode === "preset" ? applyPreset() : emptySel());
    navigateTo("console");
  }

  function openThematic(tk) {
    setScreen(tk);
  }

  function runStressTest() {
    const firing = CARDS.filter((c) => {
      try { return c.trigger(H); } catch { return false; }
    });
    // Shuffle events and assign to random months
    const shuffled = [...firing].sort(() => Math.random() - 0.5);
    const schedule = Array(12).fill(null);
    // Place events at random months (0-1 events per month, max 1 per month for first events.length months)
    const usedMonths = new Set();
    shuffled.forEach((card) => {
      let m;
      do { m = Math.floor(Math.random() * 12); } while (usedMonths.has(m));
      usedMonths.add(m);
      schedule[m] = card;
    });
    const decay = getDecay(H, cfg.climate);
    setSim({
      month: 0,
      phase: 'enter',
      resources: { battery: 100, water: 100, food: 100, security: 100 },
      score: 100,
      schedule,
      decay,
      currentEvent: null,
      eventVisible: false,
      prevResources: null,
    });
  }

  /* ---- AUTO-ADVANCE SIMULATION ---- */
  useEffect(() => {
    if (!sim || sim.phase === 'done') return;
    if (sim.phase === 'enter') {
      // Start first month after a brief delay
      const t = setTimeout(() => {
        setSim((prev) => ({ ...prev, phase: 'decay' }));
      }, 600);
      return () => clearTimeout(t);
    }
    if (sim.phase === 'decay') {
      // Apply monthly decay to resources
      const res = { ...sim.resources };
      res.battery = Math.max(0, Math.min(100, res.battery - sim.decay.battery));
      res.water = Math.max(0, Math.min(100, res.water - sim.decay.water));
      res.food = Math.max(0, Math.min(100, res.food - sim.decay.food));
      res.security = Math.max(0, Math.min(100, res.security - sim.decay.security));
      const scoreChange = -(sim.decay.battery + sim.decay.water + sim.decay.food + sim.decay.security) * 0.05;

      // Check if there's an event this month
      const eventCard = sim.schedule[sim.month];
      if (eventCard) {
        const impact = getCardImpact(eventCard);
        const newRes = { ...res };
        newRes[impact.resource] = Math.max(0, Math.min(100, newRes[impact.resource] + impact.amount));
        setSim((prev) => ({
          ...prev,
          phase: 'event',
          resources: res,
          prevResources: { ...prev.resources },
          currentEvent: { card: eventCard, impact },
          eventVisible: true,
        }));
      } else {
        setSim((prev) => ({
          ...prev,
          phase: 'enter',
          month: prev.month + 1,
          resources: res,
          score: Math.max(0, Math.min(100, prev.score + scoreChange)),
          prevResources: { ...prev.resources },
          currentEvent: null,
          eventVisible: false,
        }));
      }
    }
  }, [sim]);

  function handleDismissEvent() {
    setSim((prev) => {
      if (!prev || !prev.currentEvent) return prev;
      const { resource, amount, scoreImpact } = prev.currentEvent.impact;
      const newRes = { ...prev.resources };
      newRes[resource] = Math.max(0, Math.min(100, newRes[resource] + amount));
      const newMonth = prev.month + 1;
      const done = newMonth >= 12;
      return {
        ...prev,
        phase: done ? 'done' : 'enter',
        month: newMonth,
        resources: newRes,
        score: Math.max(0, Math.min(100, prev.score + scoreImpact)),
        currentEvent: null,
        eventVisible: false,
      };
    });
  }

  /* progress per thematic for the gauges */
  function progress(tk) {
    const th = THEMATICS[tk];
    let rel = 0, done = 0;
    th.steps.forEach((st) => {
      const relevant = !st.relevant || st.relevant(H);
      if (!relevant) return;
      rel++;
      if (H.any(tk, st.id)) done++;
    });
    return { done, rel };
  }

  function applyPreset() {
    const s = emptySel();
    s.electricity = {
      needs: ["lights","phones","starlink","dcfridge","waterpump"], voltage: "v24",
      generate: ["panel400","panel400"], controller: "victron_150_35",
      battery: "lifepo4_100ah", inverter: "inv_2000",
      wiring: ["pv_wire","busbar","breakers","monitor"], backup: ["gen_2000"],
      detect: ["dog", "motion"], fire: ["fireball"],
      localcomms: ["vhf"], internet: ["starlink"],
    };
    s.water = {
      collect: ["rain", "streambox"], move: "gravity", store: "poly",
      filter: ["prefilter", "uv"], use: ["greywater"],
    };
    s.food = { grow: ["beds"], preserve: ["jars"], cook: ["gas"] };
    return s;
  }

  function toggle(tk, st, id) {
    setSel((prev) => {
      const cur = prev[tk][st.id];
      let next;
      if (st.multi) {
        const arr = Array.isArray(cur) ? cur : [];
        next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      } else {
        next = cur === id ? null : id;
      }
      return { ...prev, [tk]: { ...prev[tk], [st.id]: next } };
    });
  }

  /* ======================================================= RENDERERS ===== */

  const shell = (children) => (
    <div style={{ background: C.ink, color: C.bone, fontFamily: FONT_BODY, minHeight: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ogx-hover { transition: transform .12s ease, border-color .12s ease, background .12s ease; }
        .ogx-hover:hover { transform: translateY(-2px); }
        .tip { visibility: hidden; opacity: 0; transition: opacity .15s ease; }
        .tipwrap:hover .tip { visibility: visible; opacity: 1; }
        @keyframes loadPulse { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
        @keyframes cardGlow { 0%, 100% { box-shadow: 0 0 0 transparent; } 50% { box-shadow: 0 0 18px rgba(239,162,74,0.3); } }
        /* ---- YEAR DASHBOARD ANIMATIONS ---- */
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-120%); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 rgba(239,162,74,0); } 50% { box-shadow: 0 0 20px rgba(239,162,74,0.4); } }
        @keyframes pulseRed { 0%, 100% { box-shadow: 0 0 0 rgba(217,83,79,0); } 50% { box-shadow: 0 0 16px rgba(217,83,79,0.5); } }
        @keyframes pulseGreen { 0%, 100% { box-shadow: 0 0 0 rgba(134,184,95,0); } 50% { box-shadow: 0 0 16px rgba(134,184,95,0.5); } }
        @keyframes meterFill { from { width: 0%; } to { width: var(--target); } }
        @keyframes scoreTick { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes seasonPulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        @keyframes dotsPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .sim-meter-transition { transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .sim-event-card { animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .sim-event-exit { animation: slideOutLeft 0.4s ease-in forwards; }
        .sim-impact-float { animation: floatUp 1.2s ease-out forwards; pointer-events: none; }
        .sim-score-tick { animation: scoreTick 0.4s ease-out; }
        .sim-glow-critical { animation: pulseRed 1.5s ease-in-out infinite; }
        .sim-glow-good { animation: pulseGreen 1.5s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>{children}</div>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(8,7,5,0.85)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100,
          animation: "loadPulse 1.5s ease-in-out infinite",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.amber, letterSpacing: 2, textTransform: "uppercase" }}>
              Loading
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.amber,
                  animation: `loadPulse 1.5s ease-in-out ${i * 0.25}s infinite`,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function ledger() {
    const over = remaining < 0;
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={18} color={C.amber} />
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.mute, letterSpacing: 1 }}>BUDGET · {tier.label}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14 }}>${cfg.budget.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.mute, letterSpacing: 1 }}>SPENT ${spent.toLocaleString()}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: over ? C.over : C.ok }}>
              {over ? "-$" + Math.abs(remaining).toLocaleString() + " OVER" : "$" + remaining.toLocaleString() + " left"}
            </div>
          </div>
        </div>

        {/* Budget breakdown bar chart */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <BarChart3 size={12} color={C.faint} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>Breakdown</span>
          </div>
          <div style={{ height: 18, background: C.ink, borderRadius: 6, overflow: "hidden", display: "flex" }}>
            {THEMATIC_ORDER.map((tk) => {
              const th = THEMATICS[tk];
              const amt = breakdown[tk];
              if (amt === 0 && spentTotal === 0) return null;
              const pct = spentTotal > 0 ? (amt / cfg.budget) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div key={tk} style={{
                  width: `${pct}%`, minWidth: 2,
                  background: th.color, opacity: 0.85,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "width 0.3s ease",
                }} title={`${th.label}: $${amt.toLocaleString()}`} />
              );
            })}
            {remaining2 > 0 && (
              <div style={{
                width: `${(remaining2 / cfg.budget) * 100}%`,
                background: C.line, opacity: 0.5,
                display: "flex", alignItems: "center", justifyContent: "center",
              }} title={`Remaining: $${remaining2.toLocaleString()}`} />
            )}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {THEMATIC_ORDER.map((tk) => {
              const th = THEMATICS[tk];
              const amt = breakdown[tk];
              if (amt === 0) return null;
              return (
                <div key={tk} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.faint }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: th.color }} />
                  <span style={{ fontFamily: FONT_MONO }}>{th.label}</span>
                  <span style={{ fontFamily: FONT_MONO }}>${amt.toLocaleString()}</span>
                </div>
              );
            })}
            {remaining2 > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.faint }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: C.line, opacity: 0.5 }} />
                <span style={{ fontFamily: FONT_MONO }}>Left</span>
                <span style={{ fontFamily: FONT_MONO }}>${remaining2.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- WELCOME ---------- */
  function renderWelcome() {
    const ready = cfg.climate && cfg.setup && cfg.budget > 0;
    return shell(
      <div>
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 20 }}>
          <img src="/ogx-simulator/logo.png" alt="OGX Logo"
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 8, border: `2px solid ${C.amber}` }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 4, color: C.amber }}>OG · EXODUS</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, letterSpacing: 1, margin: "6px 0", textTransform: "uppercase" }}>
            Welcome to the <span style={{ color: C.amber }}>OGX</span> Simulation
          </h1>
          <p style={{ color: C.mute, maxWidth: 560, margin: "0 auto", lineHeight: 1.5 }}>
            What would you build if the grid went down? Pick your climate and setup, choose your gear across
            electricity ⚡ water 💧 and food 🌱 — then stress-test it against a hard year. Prices are real-world
            researched. Learning the trade-offs is optional — just build and see if you survive.
          </p>
        </div>

        <SectionLabel n="01" text="Choose your climate" color={C.water} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 18 }}>
          {CLIMATES.map((cl) => (
            <PickCard key={cl.id} active={cfg.climate === cl.id} accent={C.water}
              onClick={() => setCfg((c) => ({ ...c, climate: cl.id }))}
              title={cl.name} emoji={cl.emoji} blurb={cl.blurb} />
          ))}
        </div>

        <SectionLabel n="02" text="Choose your setup" color={C.food} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 18 }}>
          {SETUPS.map((sp) => (
            <PickCard key={sp.id} active={cfg.setup === sp.id} accent={C.food}
              onClick={() => setCfg((c) => ({ ...c, setup: sp.id }))}
              title={sp.name} emoji={sp.emoji} blurb={sp.blurb} />
          ))}
        </div>

        <SectionLabel n="03" text="Set your budget" color={C.power} />
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mute, letterSpacing: 1, marginBottom: 6 }}>
            HOW MUCH CAN YOU SPEND? (put as much as you wish)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.amber }}>$</span>
            <input type="number" min={0} value={cfg.budget}
              onChange={(e) => setCfg((c) => ({ ...c, budget: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
              style={{
                background: C.ink, color: C.bone, border: `1px solid ${C.line}`, borderRadius: 8,
                padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 20, width: 180,
              }} />
            <div style={{ display: "flex", gap: 6 }}>
              {[3000, 8000, 20000].map((b) => (
                <button key={b} onClick={() => setCfg((c) => ({ ...c, budget: b }))}
                  style={{ background: "transparent", color: C.mute, border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 8px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer" }}>
                  ${b / 1000}k
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mute, letterSpacing: 1, marginBottom: 6 }}>PRICE TIER</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {Object.entries(TIERS).map(([k, t]) => (
              <button key={k} onClick={() => setCfg((c) => ({ ...c, tier: k }))}
                className="ogx-hover" style={{
                  textAlign: "left", background: cfg.tier === k ? C.panel2 : C.ink,
                  border: `1px solid ${cfg.tier === k ? C.amber : C.line}`, borderRadius: 10, padding: 10, cursor: "pointer", color: C.bone,
                }}>
                <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 15 }}>{t.label}</div>
                <div style={{ color: C.mute, fontSize: 11, lineHeight: 1.3, marginTop: 2 }}>{t.sub}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.amber, marginTop: 4 }}>x{t.mult} prices</div>
              </button>
            ))}
          </div>

          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mute, letterSpacing: 1, marginBottom: 6 }}>BUILD MODE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
            <button onClick={() => setCfg((c) => ({ ...c, mode: "diy" }))} className="ogx-hover"
              style={{ textAlign: "left", background: cfg.mode === "diy" ? C.panel2 : C.ink, border: `1px solid ${cfg.mode === "diy" ? C.amber : C.line}`, borderRadius: 10, padding: 10, cursor: "pointer", color: C.bone }}>
              <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 15 }}>Full DIY build</div>
              <div style={{ color: C.mute, fontSize: 11, marginTop: 2 }}>Start from a blank rig and choose everything yourself.</div>
            </button>
            <button onClick={() => setCfg((c) => ({ ...c, mode: "preset" }))} className="ogx-hover"
              style={{ textAlign: "left", background: cfg.mode === "preset" ? C.panel2 : C.ink, border: `1px solid ${cfg.mode === "preset" ? C.amber : C.line}`, borderRadius: 10, padding: 10, cursor: "pointer", color: C.bone }}>
              <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 15 }}>Start from a preset</div>
              <div style={{ color: C.mute, fontSize: 11, marginTop: 2 }}>Load a sensible starter build and tweak from there.</div>
            </button>
          </div>
        </div>

        <button disabled={!ready} onClick={startBuild} className="ogx-hover"
          style={{
            width: "100%", background: ready ? C.amber : C.panel, color: ready ? C.ink : C.faint,
            border: "none", borderRadius: 12, padding: 16, fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 18, letterSpacing: 1, textTransform: "uppercase", cursor: ready ? "pointer" : "not-allowed",
          }}>
          {ready ? "Begin the build →" : "Pick a climate & setup to begin"}
        </button>
      </div>
    );
  }

  /* ---------- CONSOLE ---------- */
  function renderConsole() {
    const cl = CLIMATES.find((c) => c.id === cfg.climate);
    const sp = SETUPS.find((s) => s.id === cfg.setup);
    return shell(
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={() => setScreen("welcome")} style={backBtn()}><ArrowLeft size={16} /> Restart</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 18 }}>{sp.emoji} {sp.name}</div>
            <div style={{ color: C.mute, fontSize: 12, fontFamily: FONT_MONO }}>{cl.emoji} {cl.name}</div>
          </div>
        </div>

        {ledger()}

        {/* Feature 1: Shareable result card */}
        {(() => {
          const cl = CLIMATES.find((c) => c.id === cfg.climate);
          const sp = SETUPS.find((s) => s.id === cfg.setup);
          const genLabels = [];
          if (hasSolar(H)) genLabels.push("Solar");
          if (H.has("electricity", "generate", "wind")) genLabels.push("Wind");
          if (H.has("electricity", "generate", "hydro")) genLabels.push("Hydro");
          if (hasBackup(H)) genLabels.push("Genset");
          if (genLabels.length === 0) genLabels.push("—");
          const battLabel = H.any("electricity", "battery")
            ? (hasLithium(H) ? "LiFePO4" : "Lead-acid")
            : "none";
          const genStr = genLabels.join(" + ") + (battLabel !== "none" ? " + " + battLabel : "");
          const waterSources = [];
          if (H.has("water", "collect", "rain")) waterSources.push("Rainwater");
          if (H.has("water", "collect", "streambox") || H.has("water", "collect", "streamdirect")) waterSources.push("Stream");
          if (H.has("water", "collect", "ground") || H.has("water", "collect", "borewell")) waterSources.push("Well");
          if (H.has("water", "collect", "ro")) waterSources.push("RO");
          if (waterSources.length === 0) waterSources.push("—");
          const waterMove = H.any("water", "move") ? (H.has("water", "move", "gravity") ? "Gravity" : H.has("water", "move", "ram") ? "Ram pump" : "Pump") : "—";
          const waterStore = H.any("water", "store") ? (H.has("water", "store", "poly") ? "Poly tank" : H.has("water", "store", "ferro") ? "Cistern" : "Tank") : "—";
          const growLabel = H.any("food", "grow") ? (H.has("food", "grow", "beds") ? "Raised beds" : H.has("food", "grow", "aquaponics") ? "Aquaponics" : "Garden") : "—";
          const preserveLabel = H.any("food", "preserve") ? (H.has("food", "preserve", "jars") ? "Jars" : H.has("food", "preserve", "freeze") ? "Freeze" : "Ferment") : "—";
          const cookLabel = H.any("food", "cook") ? (H.has("food", "cook", "gas") ? "Gas stove" : H.has("food", "cook", "wood") ? "Wood stove" : H.has("food", "cook", "solar") ? "Solar cooker" : "—") : "—";
          const shareText = [
            "🏠 OGX OFF-GRID SETUP",
            (cl ? cl.emoji + " " + cl.name : "") + " · " + (sp ? sp.emoji + " " + sp.name : ""),
            "Budget: $" + cfg.budget.toLocaleString() + " · Spent: $" + spent.toLocaleString(),
            "⚡ " + genStr,
            "💧 " + waterSources.join(" + ") + " + " + waterMove + " + " + waterStore,
            "🌱 " + growLabel + " + " + preserveLabel + " + " + cookLabel,
            "Build yours: https://og-x-3.github.io/ogx-simulator/",
          ].join("\n");
          return (
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => { navigator.clipboard.writeText(shareText).then(() => { setShareMsg("Copied!"); setTimeout(() => setShareMsg(null), 2000); }).catch(() => setShareMsg("Failed to copy")); }}
                style={{ width: "100%", background: "transparent", color: C.amber, border: `1px solid ${C.amberDeep}`, borderRadius: 10, padding: 10, fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer", marginBottom: 6 }}>
                <Share2 size={14} style={{ verticalAlign: "-2px" }} /> Share your setup
              </button>
              {shareMsg && <div style={{ textAlign: "center", color: C.ok, fontFamily: FONT_MONO, fontSize: 11, marginBottom: 6 }}>{shareMsg}</div>}

              {/* Feature 2: Email capture */}
              <EmailCapture />
            </div>
          );
        })()}

        {/* setup viewport */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ aspectRatio: "400 / 200", width: "100%" }}>
            <SceneSVG setup={cfg.setup} climate={cfg.climate} color={C.power} sel={sel} />
          </div>
        </div>
        <button onClick={() => setScreen("prompt")} className="ogx-hover"
          style={{ width: "100%", background: "transparent", color: C.amber, border: `1px dashed ${C.amberDeep}`, borderRadius: 10, padding: 10, fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer", marginBottom: 16 }}>
          <Sparkles size={14} style={{ verticalAlign: "-2px" }} /> Generate an AI prompt to make this image your own
        </button>

        <SectionLabel n="" text="Your dashboards — tap to configure" color={C.amber} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(1,1fr)", gap: 10, marginBottom: 16 }}>
          {THEMATIC_ORDER.map((tk) => {
            const th = THEMATICS[tk];
            const Icon = th.icon;
            const pr = progress(tk);
            return (
              <div key={tk} className="tipwrap ogx-hover" onClick={() => openThematic(tk)}
                style={{ position: "relative", background: C.panel, border: `1px solid ${C.line}`, borderLeft: `4px solid ${th.color}`, borderRadius: 12, padding: 14, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={22} color={th.color} />
                    <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 18 }}>{th.label}</div>
                  </div>
                  <ChevronRight size={18} color={C.mute} />
                </div>
                <div style={{ color: C.mute, fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>{th.short}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 6, background: C.ink, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pr.rel ? (pr.done / pr.rel) * 100 : 0}%`, height: "100%", background: th.color }} />
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mute }}>{pr.done}/{pr.rel}</span>
                </div>
                {/* hover tooltip */}
                <div className="tip" style={{
                  position: "absolute", left: 12, right: 12, bottom: "100%", marginBottom: 6, zIndex: 5,
                  background: C.ink, border: `1px solid ${th.color}`, borderRadius: 10, padding: 10, fontSize: 12, color: C.bone, lineHeight: 1.4,
                }}>
                  {th.intro}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={runStressTest} className="ogx-hover"
          style={{ width: "100%", background: C.amber, color: C.ink, border: "none", borderRadius: 12, padding: 15, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
          <AlertTriangle size={18} style={{ verticalAlign: "-3px" }} /> Stress-test a full year
        </button>
        <p style={{ color: C.faint, fontSize: 11, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          Prices are starting placeholders pending the fact-checked chapter database. This is an educational
          simulator, not electrical-safety advice.
        </p>
      </div>
    );
  }

  /* ---------- THEMATIC SHOP PAGE ---------- */
  function renderThematic(tk) {
    const th = THEMATICS[tk];
    const Icon = th.icon;
    return shell(
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={() => setScreen("console")} style={backBtn()}><ArrowLeft size={16} /> Console</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={22} color={th.color} />
            <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 22, color: th.color }}>{th.label}</div>
          </div>
        </div>

        {ledger()}

        {th.steps.map((st) => {
          const relevant = !st.relevant || st.relevant(H);
          if (!relevant) {
            return (
              <div key={st.id} style={{ opacity: 0.5, background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 15 }}>{st.title}</div>
                <div style={{ color: C.mute, fontSize: 12, marginTop: 2 }}>Not needed for your earlier choices — skipped.</div>
              </div>
            );
          }
          const infoOpen = openStepInfo[tk + st.id];
          return (
            <div key={st.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 17 }}>
                  {st.title}{" "}
                  {st.multi && <Tag bg={C.panel2} fg={C.mute}>pick any</Tag>}
                  {st.optional && !st.multi && <Tag bg={C.panel2} fg={C.mute}>optional</Tag>}
                </div>
                <button onClick={() => setOpenStepInfo((s) => ({ ...s, [tk + st.id]: !infoOpen }))}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: infoOpen ? th.color : C.mute }}>
                  <Info size={18} />
                </button>
              </div>
              {infoOpen && (
                <div style={{ background: C.ink, borderLeft: `3px solid ${th.color}`, borderRadius: 6, padding: 10, margin: "8px 0", fontSize: 12.5, color: C.mute, lineHeight: 1.5 }}>
                  {st.intro}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(1,1fr)", gap: 8 }}>
                {st.options.map((op) => {
                  const on = H.has(tk, st.id, op.id);
                  const infoKey = tk + "-" + st.id + "-" + op.id;
                  const showWhy = optionInfo[infoKey];
                  return (
                    <div key={op.id} style={{ position: "relative" }}>
                      <button onClick={() => toggle(tk, st, op.id)} className="ogx-hover"
                        style={{
                          textAlign: "left", width: "100%", background: on ? C.panel2 : C.ink,
                          border: `1px solid ${on ? th.color : C.line}`, borderRadius: 10, padding: 11, cursor: "pointer", color: C.bone, position: "relative",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                            {op.name}
                            {/* Why-this option - appears on hover */}
                            {op.why && (
                              <span onMouseEnter={() => setOptionInfo((s) => ({ ...s, [infoKey]: true }))}
                                onMouseLeave={() => setOptionInfo((s) => ({ ...s, [infoKey]: false }))}
                                style={{ display: "inline-flex", alignItems: "center", cursor: "help" }}
                                title="Pros & Cons">
                                <HelpCircle size={14} color={showWhy ? th.color : C.faint} style={{ verticalAlign: "-1px" }} />
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: on ? th.color : C.amber }}>
                              ${(on ? getOptionSpent(op) : price(op)).toLocaleString()}
                            </span>
                            {on ? <Check size={16} color={th.color} /> : <ShoppingCart size={14} color={C.faint} />}
                          </div>
                        </div>
                        <div style={{ color: C.mute, fontSize: 11.5, marginTop: 4, lineHeight: 1.4 }}>{op.blurb}</div>
                        {op.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            {op.tags.map((t) => (
                              <Tag key={t} bg={C.ink}
                                fg={t === "risk" ? C.over : t === "safety" ? C.ok : t === "diyfav" ? C.amber : C.mute}>
                                {tagLabel(t)}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </button>
                      {/* Configurator — outside the button so sliders work */}
                      {on && (
                        <div style={{ background: C.ink, border: `1px solid ${th.color}`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "8px 11px 11px" }}>
                          <ConfigPanel op={op} cfg={cfgValues[op.id]} setCfg={(fn) => {
                            const next = typeof fn === "function" ? fn(cfgValues[op.id]) : fn;
                            setCfgValues((prev) => ({ ...prev, [op.id]: next }));
                          }} tier={tier} color={th.color} remainingBudget={cfg.budget - spent} globalBudget={cfg.budget} />
                        </div>
                      )}
                      {/* Educational "why choose this" popover */}
                      {showWhy && op.why && (
                        <div style={{
                          position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, zIndex: 10,
                          background: C.ink, border: `1px solid ${th.color}`, borderRadius: 10, padding: 10,
                          fontSize: 12.5, lineHeight: 1.5, color: C.bone,
                          animation: "loadPulse 0.3s ease",
                        }}>
                          {/* Equipment illustration for charge controller options */}
                          {(op.id === "pwm" || op.id === "mppt" || op.id === "mpptlith" || op.id === "split") && (
                            <div style={{ textAlign: "center", marginBottom: 8 }}>
                              <svg width="100" height="70" viewBox="0 0 100 70">
                                <rect x="25" y="5" width="50" height="50" rx="4" fill="#1A1A1A" stroke={C.power} strokeWidth="1.2" />
                                <rect x="32" y="12" width="36" height="16" rx="2" fill="#0A2A0A" opacity="0.95" />
                                <line x1="36" y1="18" x2="56" y2="18" stroke="#3AFF3A" strokeWidth="0.8" opacity="0.8" />
                                <line x1="36" y1="22" x2="48" y2="22" stroke="#3AFF3A" strokeWidth="0.8" opacity="0.5" />
                                <circle cx="33" cy="36" r="3" fill="#3AFF3A" opacity="0.9">
                                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="43" cy="36" r="3" fill={C.power} opacity="0.7" />
                                <circle cx="53" cy="36" r="3" fill="#3AFF3A" opacity="0.5" />
                                <line x1="28" y1="46" x2="72" y2="46" stroke="#2A2A2A" strokeWidth="0.8" />
                                <line x1="28" y1="50" x2="72" y2="50" stroke="#2A2A2A" strokeWidth="0.8" />
                                <line x1="25" y1="12" x2="5" y2="0" stroke={C.power} strokeWidth="1" opacity="0.5" />
                                <line x1="75" y1="20" x2="95" y2="10" stroke={C.power} strokeWidth="1" opacity="0.5" />
                                <text x="50" y="65" textAnchor="middle" fill={C.mute} style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 1 }}>CHARGE CONTROLLER</text>
                              </svg>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.ok, letterSpacing: 1, textTransform: "uppercase" }}>PROS</span>
                              <div style={{ fontSize: 11, color: C.bone, marginTop: 1 }}>{op.why?.split("CONS:")[0]?.replace("PROS:", "")?.trim() || op.why}</div>
                            </div>
                            {op.why?.includes("CONS:") && (
                              <div style={{ flex: 1 }}>
                                <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.over, letterSpacing: 1, textTransform: "uppercase" }}>CONS</span>
                                <div style={{ fontSize: 11, color: C.mute, marginTop: 1 }}>{op.why?.split("CONS:")[1]?.trim()}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={() => setScreen("console")} className="ogx-hover"
          style={{ width: "100%", background: th.color, color: C.ink, border: "none", borderRadius: 12, padding: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginTop: 4 }}>
          Done — back to console
        </button>

      </div>
    );
  }

  /* ---------- AI PROMPT PAGE ---------- */
  function renderPrompt() {
    const [copied, setCopied] = React.useState(false);
    const cl = CLIMATES.find((c) => c.id === cfg.climate);
    const sp = SETUPS.find((s) => s.id === cfg.setup);
    const parts = [];
    THEMATIC_ORDER.forEach((tk) => {
      const th = THEMATICS[tk];
      const chosen = [];
      th.steps.forEach((st) => {
        const v = sel[tk][st.id];
        const ids = Array.isArray(v) ? v : v ? [v] : [];
        ids.forEach((id) => {
          const op = st.options.find((x) => x.id === id);
          if (op) chosen.push(op.name);
        });
      });
      if (chosen.length) parts.push(`${th.label}: ${chosen.join(", ")}`);
    });
    const sceneVibe = {
      tropics: "warm golden sunset light over turquoise water, humid tropical atmosphere with dramatic cumulus clouds",
      arid: "harsh midday sun, deep angular shadows, dry dusty ground, ochre and terracotta palette",
      temperate: "soft afternoon light, green canopy, dappled sunlight through leaves, lush surroundings",
      mediterranean: "golden hour light, dry grass, warm terra-cotta and sage green palette, cicada-season feeling",
      maritime: "overcast diffused grey light, choppy water, salt-weathered atmosphere, cool muted palette",
      alpine: "crisp cold atmosphere, long blue shadows across snow, winter afternoon light",
      boreal: "grey winter sky, soft snow light, deep blue and warm amber contrast, northern wilderness",
    };
    const vibe = sceneVibe[cfg.climate] || "natural golden hour light";
    const prompt =
      `Wide establishing shot of a ${sp.name.toLowerCase()} living off-grid in a ${cl.name.toLowerCase()} climate. ` +
      `${vibe}. ` +
      `Visible off-grid systems: ${parts.join("; ") || "a basic starter setup with a few solar panels"}. ` +
      `Style: OG Exodus — anti-establishment DIY, salvaged and weathered materials, muted earthy palette ` +
      `with warm amber accents, subtle grit. Eye-level shot. ` +
      `CRITICAL: Keep the four corners of the frame clean and uncluttered — no elements overlapping the edges. ` +
      `No text, no logos, no people. Aspect ratio 16:9, landscape orientation.`;
    return shell(
      <div>
        <button onClick={() => setScreen("console")} style={backBtn()}><ArrowLeft size={16} /> Console</button>

        <h2 style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 26, marginTop: 12 }}>
          <Sparkles size={22} color={C.amber} style={{ verticalAlign: "-3px" }} /> Make this scene your own
        </h2>

        <p style={{ color: C.mute, lineHeight: 1.5, marginBottom: 12, fontSize: 14 }}>
          This prompt is built from <strong style={{ color: C.bone }}>your exact choices</strong> — climate, setup, and every piece of equipment you picked.
          Paste it into an AI image generator to get a custom scene of your off-grid setup.
        </p>

        {/* The prompt box */}
        <div style={{
          background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16,
          fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.6, color: C.bone, whiteSpace: "pre-wrap",
          marginBottom: 12, maxHeight: 260, overflowY: "auto",
        }}>
          {prompt}
        </div>

        {/* Copy + download buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => {
            try { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
          }} className="ogx-hover"
            style={{ flex: 1, background: copied ? C.ok : C.amber, color: C.ink, border: "none", borderRadius: 10, padding: 12, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
            {copied ? "Copied!" : "Copy prompt"}
          </button>
        </div>

        {/* How to use section */}
        <div style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.amber, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>How to use this</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ background: C.panel, borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 11, color: C.amber, flexShrink: 0 }}>1</div>
              <div>
                <div style={{ color: C.bone, fontSize: 13, fontWeight: 600 }}>Leonardo AI (free, recommended)</div>
                <div style={{ color: C.mute, fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>Go to <span style={{ color: C.amber }}>leonardo.ai/create</span> — paste prompt. Use model: <strong style={{ color: C.bone }}>Leonardo Phoenix</strong>, preset: <strong style={{ color: C.bone }}>Alchemy V2</strong>, aspect: <strong style={{ color: C.bone }}>16:9</strong>. Generate 4 variants, pick your favorite.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ background: C.panel, borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 11, color: C.amber, flexShrink: 0 }}>2</div>
              <div>
                <div style={{ color: C.bone, fontSize: 13, fontWeight: 600 }}>Midjourney</div>
                <div style={{ color: C.mute, fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>Add <span style={{ color: C.amber }}>--ar 16:9 --style raw --s 200</span> to the end of the prompt.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ background: C.panel, borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 11, color: C.amber, flexShrink: 0 }}>3</div>
              <div>
                <div style={{ color: C.bone, fontSize: 13, fontWeight: 600 }}>Upload your image</div>
                <div style={{ color: C.mute, fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>Save your favorite generation as a 16:9 PNG. The OGX Simulator overlays its dashboards on top — the clean corners keep everything readable.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Need inspiration? */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <HelpCircle size={14} color={C.mute} />
            <span style={{ color: C.mute, fontSize: 12 }}>
              Not using AI image tools? The built-in scene art works fine — this is just for your own version.
            </span>
          </div>
        </div>

      </div>
    );
  }

  /* ---------- YEAR DASHBOARD ---------- */
  function renderCards() {
    // If simulation is active, render the year dashboard
    if (sim) {
      const season = getSeason(sim.month >= 12 ? 11 : sim.month);
      const monthData = MONTHS[sim.month >= 12 ? 11 : sim.month];
      const seasonColor = getSeasonColor(season);
      const resources = sim.resources || { battery: 100, water: 100, food: 100, security: 100 };
      const { battery, water, food, security } = resources;
      const isDone = sim.phase === 'done';

      function Meter({ label, value, color, icon: MeterIcon, unit }) {
        const isCritical = value < 20;
        const isLow = value < 40;
        return (
          <div style={{
            background: C.panel2, border: `1px solid ${isCritical ? C.over : C.line}`,
            borderRadius: 10, padding: 10, minWidth: 0,
            boxShadow: isCritical ? '0 0 12px rgba(217,83,79,0.25)' : 'none',
            animation: isCritical ? 'pulseRed 1.5s ease-in-out infinite' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MeterIcon size={14} color={isCritical ? C.over : color} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.mute, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600, color: isCritical ? C.over : isLow ? C.amber : color }}>
                {Math.round(value)}{unit}
              </span>
            </div>
            {/* Animated meter bar */}
            <div style={{ height: 8, background: C.ink, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div className="sim-meter-transition" style={{
                width: `${Math.round(value)}%`, height: '100%',
                borderRadius: 5,
                background: `linear-gradient(90deg, ${isCritical ? C.over : color}, ${isCritical ? C.over + '88' : color + '88'})`,
                boxShadow: isCritical ? '0 0 8px rgba(217,83,79,0.4)' : 'none',
                position: 'relative',
              }}>
                {/* Shimmer effect */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        );
      }

      function ResourceImpactBadge({ amount, resource }) {
        const isPositive = amount > 0;
        const impactColor = isPositive ? C.ok : C.over;
        const label = resource.charAt(0).toUpperCase() + resource.slice(1);
        return (
          <div className="sim-impact-float" style={{
            position: 'absolute', top: -8, right: 8,
            background: isPositive ? C.ok + '33' : C.over + '33',
            border: `1px solid ${impactColor}`,
            borderRadius: 6, padding: '2px 8px',
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
            color: impactColor,
          }}>
            {isPositive ? '+' : ''}{amount > 0 ? '▲' : '▼'} {Math.abs(amount)}{'%'} {label}
          </div>
        );
      }

      // Resource icon map
      const resourceIcons = {
        battery: Zap, water: Droplet, food: Sprout, security: Shield,
      };

      return (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(8,7,5,0.9)',
          display: 'flex', flexDirection: 'column',
          padding: 16, zIndex: 60, overflowY: 'auto',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          {/* Inner container */}
          <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

            {/* Header with scene */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Feature 4: Exit / Back to console button */}
                <button onClick={() => { setSim(null); setScreen("console"); }} style={backBtn()}><ArrowLeft size={14} /> Console</button>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, color: C.faint, textTransform: 'uppercase' }}>
                    Year Simulation
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Stress Test <span style={{ color: C.amber }}>{isDone ? 'Complete' : 'Running'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSim(null)}
                style={{ background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.mute, fontFamily: FONT_MONO, fontSize: 11 }}>
                <X size={14} style={{ verticalAlign: '-2px' }} /> Close
              </button>
            </div>

            {/* Scene with seasonal effects */}
            {!isDone && (
              <div style={{
                background: C.panel, border: `1px solid ${C.line}`,
                borderRadius: 14, overflow: 'hidden', marginBottom: 12,
                transition: 'all 0.5s ease',
                boxShadow: `0 0 20px ${seasonColor}22`,
              }}>
                <div style={{ aspectRatio: '400 / 160', width: '100%' }}>
                  <SceneSVG setup={cfg.setup} climate={cfg.climate} color={C.power} season={season} sel={sel} />
                </div>
                {/* Season indicator bar */}
                <div style={{
                  background: `linear-gradient(90deg, ${seasonColor}33, ${seasonColor}22)`,
                  padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  borderTop: `1px solid ${seasonColor}33`,
                }}>
                  <span style={{ fontSize: 16, animation: 'seasonPulse 2s ease-in-out infinite' }}>
                    {getSeasonEmoji(season)}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: seasonColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {season} — {monthData.name}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint }}>
                    {getTempEmoji(monthData.temp)} {monthData.temp}
                  </span>
                </div>
              </div>
            )}

            {/* Done screen */}
            {isDone && (
              <div style={{
                background: C.panel, border: `1px solid ${C.line}`,
                borderRadius: 14, padding: 24, marginBottom: 12, textAlign: 'center',
                animation: 'fadeIn 0.5s ease-out',
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', letterSpacing: 1, color: C.amber }}>
                  Year Complete
                </div>
                <div style={{ color: C.mute, marginTop: 4, fontSize: 14 }}>
                  Your off-grid build survived a full year of simulated challenges.
                </div>
                {/* Final metrics */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                  marginTop: 16, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto',
                }}>
                  {[
                    { label: 'Battery', value: Math.round(sim.resources.battery), color: C.power },
                    { label: 'Water', value: Math.round(sim.resources.water), color: C.water },
                    { label: 'Food', value: Math.round(sim.resources.food), color: C.food },
                    { label: 'Security', value: Math.round(sim.resources.security), color: C.sec },
                  ].map((m) => (
                    <div key={m.label} style={{ textAlign: 'center', padding: 8, background: C.panel2, borderRadius: 8 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, textTransform: 'uppercase' }}>{m.label}</div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: m.value < 30 ? C.over : m.value < 60 ? C.amber : m.color }}>
                        {m.value}%
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint, textTransform: 'uppercase', letterSpacing: 1 }}>Survival Score</div>
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700,
                    color: sim.score >= 70 ? C.ok : sim.score >= 40 ? C.amber : C.over,
                    animation: 'scoreTick 0.5s ease-out',
                  }}>
                    {Math.round(sim.score)}
                  </div>
                </div>
              </div>
            )}

            {/* Resource meters grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8, marginBottom: 12,
            }}>
              {[
                { label: 'Battery', value: battery, color: C.power, icon: Zap, unit: '%' },
                { label: 'Water', value: water, color: C.water, icon: Droplet, unit: '%' },
                { label: 'Food', value: food, color: C.food, icon: Sprout, unit: '%' },
                { label: 'Security', value: security, color: C.sec, icon: Shield, unit: '%' },
              ].map((m) => (
                <Meter key={m.label} {...m} />
              ))}
            </div>

            {/* Timeline / Month progression */}
            <div style={{
              background: C.panel, border: `1px solid ${C.line}`,
              borderRadius: 12, padding: 12, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Year Timeline
                </div>
                {!isDone && (
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontSize: 14, color: seasonColor,
                    animation: 'seasonPulse 2s ease-in-out infinite',
                  }}>
                    {getSeasonEmoji(season)} {monthData.name} ({sim.month + 1}/12)
                  </div>
                )}
              </div>
              {/* Month bar */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'stretch', height: 32 }}>
                {MONTHS.map((m, i) => {
                  const mSeason = getSeason(i);
                  const mColor = getSeasonColor(mSeason);
                  const isPast = i < sim.month;
                  const isCurrent = i === sim.month && !isDone;
                  const hasEvent = sim.schedule && sim.schedule[i] !== null;
                  return (
                    <div key={i} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 1,
                      background: isCurrent ? mColor + '44' : isPast ? mColor + '22' : C.ink,
                      border: isCurrent ? `1px solid ${mColor}` : isPast ? `1px solid ${mColor}33` : `1px solid ${C.line}`,
                      borderRadius: 4,
                      opacity: isPast || isCurrent ? 1 : 0.5,
                      transition: 'all 0.4s ease',
                      position: 'relative',
                      boxShadow: isCurrent ? `0 0 8px ${mColor}44` : 'none',
                    }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 6, color: isCurrent ? mColor : C.faint, lineHeight: 1 }}>
                        {m.name.slice(0, 3)}
                      </span>
                      {hasEvent && (
                        <span style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 6, height: 6, borderRadius: '50%',
                          background: sim.schedule[i] && sim.schedule[i].sev === 'good' ? C.ok
                            : sim.schedule[i] && sim.schedule[i].sev === 'bad' ? C.over : C.amber,
                          boxShadow: isCurrent ? `0 0 6px ${C.over}` : 'none',
                          animation: isCurrent ? 'dotsPulse 1s ease-in-out infinite' : 'none',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: C.ink, border: `1px solid ${C.line}` }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faint }}>Future</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: getSeasonColor('spring') + '33', border: `1px solid ${getSeasonColor('spring')}33` }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faint }}>Past</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faint }}>Event</span>
                </div>
              </div>
            </div>

            {/* Survival Score */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: C.panel, border: `1px solid ${C.line}`,
              borderRadius: 10, padding: '8px 14px', marginBottom: 12,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, textTransform: 'uppercase', letterSpacing: 1 }}>
                Survival Score
              </div>
              <div className={sim.phase === 'decay' ? 'sim-score-tick' : ''} style={{
                fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700,
                color: sim.score >= 70 ? C.ok : sim.score >= 40 ? C.amber : C.over,
                transition: 'all 0.4s ease',
              }}>
                {Math.round(sim.score)}
              </div>
            </div>

            {/* Event card overlay (slides in) */}
            {sim.eventVisible && sim.currentEvent && (
              <div style={{
                position: 'relative', overflow: 'hidden',
                marginBottom: 12, borderRadius: 14,
              }}>
                <div className="sim-event-card" style={{
                  background: C.panel,
                  border: `1px solid ${sim.currentEvent.card.color}`,
                  borderRadius: 14, padding: 18,
                  boxShadow: `0 0 30px ${sim.currentEvent.card.color}22`,
                }}>
                  {/* Top bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Severity icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: sim.currentEvent.card.sev === 'good' ? C.ok + '33'
                          : sim.currentEvent.card.sev === 'bad' ? C.over + '33' : C.amber + '33',
                        border: `2px solid ${
                          sim.currentEvent.card.sev === 'good' ? C.ok
                            : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber
                        }`,
                      }}>
                        {sim.currentEvent.card.sev === 'good'
                          ? <Check size={18} color={C.ok} />
                          : <AlertTriangle size={18} color={sim.currentEvent.card.sev === 'bad' ? C.over : C.amber} />
                        }
                      </div>
                      <div>
                        <div style={{
                          fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing: 1, textTransform: 'uppercase',
                        }}>
                          {sim.currentEvent.card.sev === 'good' ? 'Positive Outcome' : 'Event Triggered'}
                        </div>
                        <div style={{
                          fontFamily: FONT_DISPLAY, fontSize: 17, textTransform: 'uppercase', letterSpacing: 0.5,
                          color: sim.currentEvent.card.sev === 'good' ? C.ok
                            : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber,
                        }}>
                          {sim.currentEvent.card.title}
                        </div>
                      </div>
                    </div>
                    {/* Resource impact badge */}
                    <div style={{ position: 'relative' }}>
                      <ResourceImpactBadge
                        amount={sim.currentEvent.impact.amount}
                        resource={sim.currentEvent.impact.resource}
                      />
                    </div>
                  </div>

                  {/* Severity tag */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: sim.currentEvent.card.sev === 'good' ? C.ok + '22'
                      : sim.currentEvent.card.sev === 'bad' ? C.over + '22' : C.amber + '22',
                    border: `1px solid ${
                      sim.currentEvent.card.sev === 'good' ? C.ok
                        : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber
                    }44`,
                    borderRadius: 5, padding: '2px 8px', marginBottom: 8,
                    fontFamily: FONT_MONO, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase',
                    color: sim.currentEvent.card.sev === 'good' ? C.ok
                      : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber,
                  }}>
                    {sim.currentEvent.card.sev === 'good' ? '✓ Good outcome'
                      : sim.currentEvent.card.sev === 'bad' ? '✗ Critical failure' : '⚠ Warning'}
                  </div>

                  {/* Card body */}
                  <p style={{ lineHeight: 1.6, fontSize: 13, color: C.bone, margin: 0 }}>
                    {sim.currentEvent.card.body}
                  </p>

                  {/* Lesson box */}
                  <div style={{
                    background: `linear-gradient(135deg, ${C.ink}, ${C.panel})`,
                    border: `1px solid ${
                      sim.currentEvent.card.sev === 'good' ? C.ok
                        : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber
                    }44`,
                    borderRadius: 8, padding: 10, marginTop: 12,
                    borderLeft: `3px solid ${
                      sim.currentEvent.card.sev === 'good' ? C.ok
                        : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber
                    }`,
                  }}>
                    <div style={{
                      fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1,
                      color: sim.currentEvent.card.sev === 'good' ? C.ok
                        : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber,
                      marginBottom: 4, textTransform: 'uppercase',
                    }}>
                      {sim.currentEvent.card.sev === 'good' ? 'Why it worked' : 'The lesson'}
                    </div>
                    <p style={{ lineHeight: 1.5, fontSize: 12.5, color: C.bone, margin: 0 }}>
                      {sim.currentEvent.card.lesson}
                    </p>
                  </div>

                  {/* Dismiss/continue button */}
                  <button onClick={handleDismissEvent} className="ogx-hover"
                    style={{
                      width: '100%', marginTop: 12,
                      background: `linear-gradient(135deg, ${
                        sim.currentEvent.card.sev === 'good' ? C.ok
                          : sim.currentEvent.card.sev === 'bad' ? C.over : C.amber
                      }, ${
                        sim.currentEvent.card.sev === 'good' ? C.ok + '88'
                          : sim.currentEvent.card.sev === 'bad' ? C.over + '88' : C.amber + '88'
                      })`,
                      color: C.ink, border: 'none', borderRadius: 10, padding: 12,
                      fontFamily: FONT_DISPLAY, fontWeight: 700, textTransform: 'uppercase',
                      cursor: 'pointer', fontSize: 14, letterSpacing: 1,
                    }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Events schedule summary (at bottom, always visible) */}
            <div style={{
              background: C.panel, border: `1px solid ${C.line}`,
              borderRadius: 10, padding: 10,
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Event Schedule ({sim.schedule.filter(Boolean).length} total)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {sim.schedule.map((card, i) => {
                  if (!card) return null;
                  const isPast = i < sim.month;
                  const isCurrentEvent = i === sim.month && sim.eventVisible;
                  const evSev = card.sev === 'good' ? C.ok : card.sev === 'bad' ? C.over : C.amber;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '4px 8px', borderRadius: 6,
                      background: isCurrentEvent ? evSev + '22' : isPast ? C.ink : 'transparent',
                      border: `1px solid ${isCurrentEvent ? evSev : C.line}`,
                      opacity: isPast ? 0.5 : 1,
                      animation: isCurrentEvent ? 'fadeIn 0.4s ease-out' : 'none',
                    }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, width: 40 }}>
                        {MONTHS[i].name.slice(0, 3)}
                      </span>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: evSev,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontFamily: FONT_DISPLAY, fontSize: 11, textTransform: 'uppercase',
                        color: isCurrentEvent ? evSev : C.bone,
                      }}>
                        {card.title}
                      </span>
                      {isPast && <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faint, marginLeft: 'auto' }}>✓</span>}
                      {isCurrentEvent && <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: evSev, marginLeft: 'auto', animation: 'dotsPulse 1s ease-in-out infinite' }}>● NOW</span>}
                    </div>
                  );
                })}
                {sim.schedule.every(c => c === null) && (
                  <div style={{ color: C.faint, fontSize: 12, padding: 8, textAlign: 'center' }}>
                    No events triggered for this build — your setup is robust!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback: old card system for no-cards case
    if (!cards) return null;
    if (cards.length === 0) {
      return (
        <Modal onClose={() => setCards(null)} accent={C.ok} title="A quiet year" icon={<Check size={26} color={C.ok} />}>
          <p style={{ lineHeight: 1.6 }}>Nothing fired against your current build — either it's genuinely robust, or you
            haven't configured enough yet for the engine to bite. Configure more thematics and run it again.</p>
        </Modal>
      );
    }
    // Old sequential card viewer (kept for backward compat)
    const card = cards[cardIdx];
    const accent = card.sev === "good" ? C.ok : card.sev === "bad" ? C.over : C.amber;
    const isLast = cardIdx >= cards.length - 1;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(8,7,5,0.82)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: C.panel,
          border: `1px solid ${card.color}`,
          borderRadius: 16, padding: 20,
          maxWidth: 480, width: "100%", maxHeight: "86vh", overflowY: "auto",
          fontFamily: FONT_BODY, color: C.bone,
          boxShadow: `0 0 30px ${card.color}30, 0 0 60px ${card.color}15`,
          animation: "cardGlow 2s ease-in-out infinite",
          position: "relative",
          overflow: "visible",
        }}>
          {/* Top accent banner */}
          <div style={{
            background: `linear-gradient(90deg, ${card.color}, ${card.color}88, transparent)`,
            height: 5, borderRadius: 4, marginBottom: 14, width: "100%",
          }} />

          {/* Glow badge */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {card.sev === "good" ? <Check size={26} color={accent} /> : <AlertTriangle size={26} color={accent} />}
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 12, color: C.mute, letterSpacing: 1 }}>
                  Year event {cardIdx + 1} / {cards.length}
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 22, color: accent, marginTop: 2 }}>
                  {card.title}
                </div>
              </div>
            </div>
            <button onClick={() => setCards(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.mute }}>
              <X size={20} />
            </button>
          </div>

          {/* Severity badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: card.sev === "good" ? C.ok + "22" : card.sev === "bad" ? C.over + "22" : C.amber + "22",
            border: `1px solid ${accent}44`,
            borderRadius: 6, padding: "2px 8px", marginBottom: 10,
            fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: accent,
          }}>
            {card.sev === "good" ? "Good outcome" : card.sev === "bad" ? "Critical failure" : "Warning"}
          </div>

          <p style={{ lineHeight: 1.7, color: C.bone, fontSize: 14 }}>{card.body}</p>

          <div style={{
            background: `linear-gradient(135deg, ${C.ink}, ${C.panel})`,
            border: `1px solid ${accent}44`,
            borderRadius: 10, padding: 12, marginTop: 14,
            borderLeft: `3px solid ${accent}`,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1, color: accent, marginBottom: 4, textTransform: "uppercase" }}>
              {card.sev === "good" ? "Why it worked" : "The lesson"}
            </div>
            <p style={{ lineHeight: 1.5, fontSize: 13.5, color: C.bone, margin: 0 }}>{card.lesson}</p>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {!isLast ? (
              <button onClick={() => setCardIdx((i) => i + 1)} className="ogx-hover"
                style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, ${accent}88)`, color: C.ink, border: "none", borderRadius: 10, padding: 12, fontFamily: FONT_DISPLAY, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", fontSize: 14 }}>
                Next event →
              </button>
            ) : (
              <button onClick={() => setCards(null)} className="ogx-hover"
                style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, ${accent}88)`, color: C.ink, border: "none", borderRadius: 10, padding: 12, fontFamily: FONT_DISPLAY, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", fontSize: 14 }}>
                Finish the year
              </button>
            )}
          </div>

          {/* Progress dots for cards */}
          {cards.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
              {cards.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i === cardIdx ? accent : C.line,
                  opacity: i === cardIdx ? 1 : 0.4,
                  transition: "all 0.2s ease",
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================== OUTPUT == */
  let body;
  if (screen === "welcome") body = renderWelcome();
  else if (screen === "console") body = renderConsole();
  else if (screen === "prompt") body = renderPrompt();
  else body = renderThematic(screen);

  return (
    <div style={{ minHeight: "100vh", background: C.ink }}>
      {body}
      {renderCards()}
    </div>
  );
}

/* ----------------------------------------------------- small components --- */
function backBtn() {
  return {
    background: "transparent", color: C.mute, border: `1px solid ${C.line}`, borderRadius: 8,
    padding: "6px 10px", fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
  };
}
function tagLabel(t) {
  return { diyfav: "DIY pick", upgrade: "upgrade", safety: "safety", risk: "risk", needsCC: "needs CC", needsInv: "needs inverter", needsPower: "draws power", needsSec: "protect it", needsComms: "needs comms", constant: "no battery" }[t] || t;
}

function SectionLabel({ n, text, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
      {n ? <span style={{ fontFamily: FONT_MONO, fontSize: 12, color }}>{n}</span> : null}
      <span style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", letterSpacing: 1, fontSize: 14, color: C.bone }}>{text}</span>
      <span style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  );
}

/* Feature 2: Email capture component */
function EmailCapture() {
  const [email, setEmail] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState(false);
  const handleSave = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("ogx_emails") || "[]");
      if (!existing.includes(email)) {
        existing.push(email);
        localStorage.setItem("ogx_emails", JSON.stringify(existing));
      }
      setSaved(true);
      setEmail("");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSave(); };
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.mute, letterSpacing: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
        <Save size={12} /> Save your plan
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="email" placeholder="your@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}
          style={{
            flex: 1, background: C.ink, color: C.bone, border: `1px solid ${error ? C.over : C.line}`, borderRadius: 6,
            padding: "6px 10px", fontFamily: FONT_MONO, fontSize: 12, outline: "none",
          }} />
        <button onClick={handleSave}
          style={{
            background: "transparent", color: C.amber, border: `1px solid ${C.amberDeep}`, borderRadius: 6,
            padding: "6px 10px", fontFamily: FONT_MONO, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
          }}>
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && <div style={{ color: C.over, fontFamily: FONT_MONO, fontSize: 10, marginTop: 4 }}>Invalid email</div>}
      {saved && <div style={{ color: C.ok, fontFamily: FONT_MONO, fontSize: 10, marginTop: 4 }}>Plan saved! We'll send you your build.</div>}
    </div>
  );
}

function PickCard({ active, accent, onClick, title, emoji, blurb }) {
  return (
    <button onClick={onClick} className="ogx-hover" style={{
      textAlign: "left", background: active ? C.panel2 : C.panel,
      border: `1px solid ${active ? accent : C.line}`, borderRadius: 10, padding: 10, cursor: "pointer", color: C.bone,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ color: C.mute, fontSize: 11, marginTop: 4, lineHeight: 1.35 }}>{blurb}</div>
    </button>
  );
}

function Modal({ children, onClose, title, icon, accent }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(8,7,5,0.78)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${accent || C.line}`, borderRadius: 16, padding: 18,
        maxWidth: 460, width: "100%", maxHeight: "86vh", overflowY: "auto",
        fontFamily: FONT_BODY, color: C.bone,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon}
            <div style={{ fontFamily: FONT_DISPLAY, textTransform: "uppercase", fontSize: 18 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.mute }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
