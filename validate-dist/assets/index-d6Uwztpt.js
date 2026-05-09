(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function e(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(n){if(n.ep)return;n.ep=!0;const o=e(n);fetch(n.href,o)}})();function st(){const t=window.__B2B_CONFIG__||{};return{baseUrl:t.baseUrl||"local://runtime",apiKey:t.apiKey||"",supportWhatsapp:t.supportWhatsapp||"201040880002",appName:t.appName||"الأهرام B2B Commerce",basePath:t.basePath||"/ahram-store/",theme:t.theme||"dark"}}function M(t=window.location.hash){const a=t.replace(/^#/,""),[e="home",r=""]=a.split("?"),n=new URLSearchParams(r);return{path:e||"home",params:n}}function N(t,a={}){const e=new URLSearchParams(a).toString();window.location.hash=`#${t}${e?`?${e}`:""}`}const Q=typeof window<"u"&&!!window.localStorage;function W(t,a=null){if(!Q)return a;try{const e=window.localStorage.getItem(t);return e==null?a:JSON.parse(e)}catch{return a}}function J(t,a){if(Q)try{window.localStorage.setItem(t,JSON.stringify(a))}catch{}}const O=(t,a,e)=>({company_id:t,company_name:a,company_logo:null,color:e}),ot=[O("nivea","نـيڤيا","#1e88e5"),O("haircode","هير كود","#8e24aa"),O("senyor","سنيور","#ff7043"),O("starky","استاركي","#26a69a"),O("red","ريد","#ef5350"),O("sparkle","سباركل","#7e57c2"),O("windex","وينديكس","#29b6f6"),O("garnier","غارنييه","#66bb6a")],E=t=>({...t,product_image:null,category:t.category||"haircare",visible:!0}),D={settings:{banner_image:null,support_whatsapp:"201040880002",hero_title:"توزيع B2B سريع، واضح، ومضبوط على الأسعار الحية",hero_subtitle:"تصفح الشرائح، أضف للسلة، وأرسل الفاتورة عبر واتساب من نسخة تشغيلية واحدة.",theme_mode:"dark",enable_pack_tier_discount:!1},tiers:[{id:"tier-base",tier_name:"base",display_name:"بدون خصم",min_order:0,is_default:!0},{id:"tier-half",tier_name:"half_million",display_name:"الفضيه",min_order:5e5,is_default:!1},{id:"tier-million",tier_name:"million",display_name:"الذهبية",min_order:1e6,is_default:!1},{id:"tier-vip",tier_name:"vip gold",display_name:"الماسية",min_order:3e6,is_default:!1}],companies:ot,products:[E({product_id:"1549",product_name:"نفيا لابلو (24ق)",company_id:"nivea",company_name:"نـيڤيا",unit_code:"carton",tier_name:"base",final_price:1872,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"skin"}),E({product_id:"1540",product_name:"نفيا كريم سوفت عادي 50مل 30% (60ق)",company_id:"nivea",company_name:"نـيڤيا",unit_code:"carton",tier_name:"base",final_price:1530,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"skin"}),E({product_id:"1517",product_name:"هير كود جل برطمان 275مل موف (48ق)",company_id:"haircode",company_name:"هير كود",unit_code:"carton",tier_name:"base",final_price:2070,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1523",product_name:"هير كود جل انبوبة 250مل ازرق -فري (48ق)",company_id:"haircode",company_name:"هير كود",unit_code:"carton",tier_name:"base",final_price:1296,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1157",product_name:"سنيور كريم للشعر هير فود 225جم (48ق)",company_id:"senyor",company_name:"سنيور",unit_code:"carton",tier_name:"base",final_price:1776,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1179",product_name:"سنيور شامبو بالكرياتين 450مل (24ق)",company_id:"senyor",company_name:"سنيور",unit_code:"carton",tier_name:"base",final_price:1524,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1148",product_name:"استاركي مخمرية 50مل الف ليلة (48ق)",company_id:"starky",company_name:"استاركي",unit_code:"carton",tier_name:"base",final_price:1050,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"beauty"}),E({product_id:"1119",product_name:"استاركي ماسك 100مل دهبي (60ق)",company_id:"starky",company_name:"استاركي",unit_code:"carton",tier_name:"base",final_price:1240,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"beauty"}),E({product_id:"1526",product_name:"ريد اكوا 300مل زاحف احمر (72ق)",company_id:"red",company_name:"ريد",unit_code:"carton",tier_name:"base",final_price:6040,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"home"}),E({product_id:"1475",product_name:"وينديكس منظف زجاج 500مل رشاش ازرق (12ق)",company_id:"windex",company_name:"وينديكس",unit_code:"carton",tier_name:"base",final_price:618,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"home"}),E({product_id:"1419",product_name:"سباركل شامبو 600 مل متقصف (12ق)",company_id:"sparkle",company_name:"سباركل",unit_code:"carton",tier_name:"base",final_price:824,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1421",product_name:"سباركل شامبو 600 مل لامع (12ق)",company_id:"sparkle",company_name:"سباركل",unit_code:"carton",tier_name:"base",final_price:824,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"615",product_name:"دوف مزيل رول اون الاصلى 50 ملى (12ق)",company_id:"nivea",company_name:"دوف",unit_code:"carton",tier_name:"base",final_price:750,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"skin"}),E({product_id:"709",product_name:"دوف شامبو 180مل ضد تساقط الشعر (24ق)",company_id:"nivea",company_name:"دوف",unit_code:"carton",tier_name:"base",final_price:1220,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"963",product_name:"غارنييه صبغة 7.1 (12ق)",company_id:"garnier",company_name:"غارنييه",unit_code:"carton",tier_name:"base",final_price:1180,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"956",product_name:"غارنييه سيروم اشراقة فاست برايت 30مل خصم 15% (12ق)",company_id:"garnier",company_name:"غارنييه",unit_code:"carton",tier_name:"base",final_price:2540,available_qty:1e3,reserved_qty:0,allow_backorder:!0,runtime_healthy:!0,category:"skin"}),E({product_id:"1549",product_name:"نفيا لابلو (24ق)",company_id:"nivea",company_name:"نـيڤيا",unit_code:"carton",tier_name:"half_million",final_price:1810,available_qty:800,reserved_qty:40,allow_backorder:!0,runtime_healthy:!0,category:"skin"}),E({product_id:"1517",product_name:"هير كود جل برطمان 275مل موف (48ق)",company_id:"haircode",company_name:"هير كود",unit_code:"carton",tier_name:"half_million",final_price:2010,available_qty:760,reserved_qty:12,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1179",product_name:"سنيور شامبو بالكرياتين 450مل (24ق)",company_id:"senyor",company_name:"سنيور",unit_code:"carton",tier_name:"million",final_price:1478,available_qty:540,reserved_qty:9,allow_backorder:!0,runtime_healthy:!0,category:"hair"}),E({product_id:"1475",product_name:"وينديكس منظف زجاج 500مل رشاش ازرق (12ق)",company_id:"windex",company_name:"وينديكس",unit_code:"carton",tier_name:"vip gold",final_price:590,available_qty:430,reserved_qty:5,allow_backorder:!0,runtime_healthy:!0,category:"home"})],dailyDeals:[{id:1,title:"عرض اليوم: رصيد تسويقي سريع",description:"منتج مختار بعرض تشغيل يومي.",image:null,price:299,stock:24,is_active:!0,sold_count:10,can_buy:!0},{id:2,title:"Bundle الرف العائلي",description:"حزمة مبيعات سريعة للشحنات الصغيرة.",image:null,price:499,stock:18,is_active:!0,sold_count:7,can_buy:!0}],flashOffers:[{id:1,title:"Flash: دعم افتتاح الطلب",description:"سعر خاص بوقت محدود.",image:null,price:399,stock:15,sold_count:5,start_time:new Date(Date.now()-36e5).toISOString(),end_time:new Date(Date.now()+864e5).toISOString(),is_active:!0,status:"active",can_buy:!0},{id:2,title:"Flash: نفاد قريب",description:"عرض ينتهي قريباً.",image:null,price:555,stock:3,sold_count:12,start_time:new Date(Date.now()-72e5).toISOString(),end_time:new Date(Date.now()+54e5).toISOString(),is_active:!0,status:"active",can_buy:!0}],authUsers:[{id:"admin-1",user_type:"admin",name:"System Administrator",phone:"",username:"admin",login_code:"admin",password:"M2020m",default_tier_name:"base",is_active:!0,is_blocked:!1},{id:"rep-1",user_type:"sales_rep",name:"أحمد السيد",phone:"01120000003",username:"01120000003",login_code:"01120000003",password:"123456",default_tier_name:"base",is_active:!0,is_blocked:!1},{id:"rep-2",user_type:"sales_rep",name:"إبراهيم عادل",phone:"01120000008",username:"01120000008",login_code:"01120000008",password:"123456",default_tier_name:"base",is_active:!0,is_blocked:!1},{id:"cust-1",user_type:"customer",name:"شركة النور للتجارة",phone:"01110000001",username:"01110000001",login_code:"01110000001",password:"1234",default_tier_name:"base",is_active:!0,is_blocked:!1,sales_rep_id:"rep-1"},{id:"cust-2",user_type:"customer",name:"مؤسسة السلام",phone:"01110000002",username:"01110000002",login_code:"01110000002",password:"1234",default_tier_name:"base",is_active:!0,is_blocked:!1,sales_rep_id:"rep-1"},{id:"cust-3",user_type:"customer",name:"هايبر المدينة",phone:"01110000005",username:"01110000005",login_code:"01110000005",password:"1234",default_tier_name:"base",is_active:!0,is_blocked:!1,sales_rep_id:"rep-2"}],customers:[{id:"cust-1",name:"شركة النور للتجارة",phone:"01110000001",address:"القاهرة",location:"القاهرة",username:"01110000001",password:"1234",created_at:new Date().toISOString(),sales_rep_id:"rep-1",created_by:"admin-1",customer_type:"rep_customer",created_by_rep_id:"rep-1",is_active:!0,default_tier_name:"base",is_blocked:!1,blocked_reason:null},{id:"cust-2",name:"مؤسسة السلام",phone:"01110000002",address:"الجيزة",location:"الجيزة",username:"01110000002",password:"1234",created_at:new Date().toISOString(),sales_rep_id:"rep-1",created_by:"admin-1",customer_type:"rep_customer",created_by_rep_id:"rep-1",is_active:!0,default_tier_name:"base",is_blocked:!1,blocked_reason:null},{id:"cust-3",name:"هايبر المدينة",phone:"01110000005",address:"المنصورة",location:"الدقهلية",username:"01110000005",password:"1234",created_at:new Date().toISOString(),sales_rep_id:"rep-2",created_by:"admin-1",customer_type:"rep_customer",created_by_rep_id:"rep-2",is_active:!0,default_tier_name:"base",is_blocked:!1,blocked_reason:null},{id:"cust-4",name:"مكتبة الإيمان",phone:"01110000003",address:"الإسكندرية",location:"الإسكندرية",username:"01110000003",password:"1234",created_at:new Date().toISOString(),sales_rep_id:null,created_by:"admin-1",customer_type:"direct",created_by_rep_id:null,is_active:!0,default_tier_name:"base",is_blocked:!1,blocked_reason:null}],orders:[{id:"order-sample-1",order_number:"ORD-2026-0001",customer_id:"cust-1",sales_rep_id:"rep-1",status:"submitted",payment_status:"unpaid",currency:"EGP",subtotal:3168,discount_total:0,grand_total:3168,created_at:new Date(Date.now()-864e5).toISOString(),updated_at:new Date(Date.now()-864e5).toISOString(),version:1,items:[{product_id:"1549",product_name_snapshot:"نفيا لابلو (24ق)",unit_code_snapshot:"carton",tier_snapshot:"base",unit_price_snapshot:1872,quantity:1,line_total:1872,pricing_snapshot:{final_price:1872}},{product_id:"1475",product_name_snapshot:"وينديكس منظف زجاج 500مل رشاش ازرق (12ق)",unit_code_snapshot:"carton",tier_snapshot:"base",unit_price_snapshot:618,quantity:2,line_total:1236,pricing_snapshot:{final_price:618}}],audit:[]}],uiEvents:[]},h=Object.freeze({GUEST:"guest",CUSTOMER:"customer",SALES_REP:"sales_rep",ADMIN:"admin"});function it(t={}){return{app:{ready:!1,online:!0,config:t},auth:{status:"anonymous",user:null,role:h.GUEST,session:null},ui:{route:"home",search:"",selectedTier:"base",selectedCompany:"all",visibleCount:12,theme:t.theme||"dark",modal:null,drawer:null,toastSeq:0},data:{settings:D.settings,tiers:D.tiers,companies:D.companies,products:D.products,dailyDeals:D.dailyDeals,flashOffers:D.flashOffers,authUsers:D.authUsers,customers:D.customers,orders:D.orders,uiEvents:D.uiEvents},cart:{items:[],customer_id:"cust-1",payment_method:"COD",note:"",updated_at:null},runtime:{lastSyncAt:null,source:"local",diagnostics:{hasHydrationError:!1,hasConsoleError:!1}}}}const H="ahram-b2b-runtime:v1";function K(t,a){return{...t,...a,app:{...t.app,...a.app||{}},auth:{...t.auth,...a.auth||{}},ui:{...t.ui,...a.ui||{}},data:{...t.data,...a.data||{}},cart:{...t.cart,...a.cart||{}},runtime:{...t.runtime,...a.runtime||{}}}}function ct(t={}){const a=it(t),e=W(H,null);let r=e?K(a,e):a;const n=new Set;function o(){return r}function c(l,d={}){const p=typeof l=="function"?l(r):l;return r=K(r,p||{}),J(H,{auth:r.auth,ui:{...r.ui,modal:null,drawer:null,visibleCount:r.ui.visibleCount},cart:r.cart,data:{customers:r.data.customers,orders:r.data.orders,uiEvents:r.data.uiEvents.slice(-200)},runtime:r.runtime}),n.forEach(S=>S(r,d)),r}function s(l){return n.add(l),()=>n.delete(l)}return{getState:o,setState:c,subscribe:s}}function dt(t){return structuredClone?structuredClone(t):JSON.parse(JSON.stringify(t))}function ut(t={}){const a=t.baseUrl&&t.baseUrl!=="local://runtime"?"remote-ready":"local";return{mode:a,async bootstrap(){return dt(D)},async ping(){return{ok:!0,mode:a}}}}function w(t){const a=Number(t||0);return new Intl.NumberFormat("ar-EG",{minimumFractionDigits:0,maximumFractionDigits:2}).format(a)}function P(t){return Number(t?.final_price??0)}function lt(t){return{product_id:t.product_id,product_name:t.product_name,unit_code:t.unit_code,tier_name:t.tier_name,final_price:P(t),available_qty:Number(t.available_qty??0),reserved_qty:Number(t.reserved_qty??0),allow_backorder:!!t.allow_backorder}}function _t(t){return{carton:"كرتونة",pack:"دسته",unit:"قطعة",piece:"قطعة",half_pack:"نصف"}[t]||t}function pt(t=[]){return t.filter(a=>a&&a.runtime_healthy!==!1&&Number(a.final_price||0)>0).map(a=>({...a,final_price:P(a),available_qty:Number(a.available_qty??0),reserved_qty:Number(a.reserved_qty??0),sellable_qty:Math.max(0,Number(a.available_qty??0)-Number(a.reserved_qty??0))}))}function mt(t=[]){const a=new Map;for(const e of t){const r=e.company_id||"unknown";a.has(r)||a.set(r,{company_id:r,company_name:e.company_name||r,company_logo:e.company_logo||null,color:e.color||"#999",count:0}),a.get(r).count+=1}return Array.from(a.values()).sort((e,r)=>e.company_name.localeCompare(r.company_name,"ar"))}function Z(t=[]){const a=new Map;for(const e of t){const r=a.get(e.product_id)||{product_id:e.product_id,product_name:e.product_name,company_id:e.company_id,company_name:e.company_name,company_logo:e.company_logo||null,color:e.color||"#999",category:e.category,product_image:e.product_image||null,units:[]};r.units.push({unit_code:e.unit_code,tier_name:e.tier_name,final_price:P(e),available_qty:Number(e.available_qty??0),reserved_qty:Number(e.reserved_qty??0),sellable_qty:Math.max(0,Number(e.available_qty??0)-Number(e.reserved_qty??0)),allow_backorder:!!e.allow_backorder,runtime_healthy:e.runtime_healthy!==!1}),a.set(e.product_id,r)}return Array.from(a.values()).map(e=>({...e,units:e.units.sort((r,n)=>(r.unit_code||"").localeCompare(n.unit_code||""))}))}function yt(t=[],a,e,r){return t.find(n=>n.product_id===a&&n.unit_code===e&&n.tier_name===r)||null}function ht(t,a){return{restoreSession(){return t.getState().auth.session},async login(e,r){const o=(t.getState().data.authUsers||[]).find(s=>[s.username,s.phone,s.login_code,s.name,s.id].filter(Boolean).includes(e)&&String(s.password||"")===String(r||""));if(!o){const s=new Error("AUTH_INVALID_CREDENTIALS");throw s.code="AUTH_INVALID_CREDENTIALS",s}if(o.is_blocked){const s=new Error("AUTH_BLOCKED_USER");throw s.code="AUTH_BLOCKED_USER",s}const c={session_id:crypto.randomUUID(),access_token:crypto.randomUUID(),expires_at:new Date(Date.now()+1e3*60*60*24*30).toISOString(),user_id:o.id,user_type:o.user_type};return t.setState(s=>({auth:{status:"authenticated",user:o,role:o.user_type||h.GUEST,session:c},ui:{...s.ui,selectedTier:o.default_tier_name||s.ui.selectedTier,route:"home"},cart:{...s.cart,customer_id:o.user_type===h.CUSTOMER?o.id:s.cart.customer_id}}),{action:"login"}),a("login",{actor_id:o.id,actor_type:o.user_type,session_id:c.session_id,payload:{identity:e}}),{session:c,user:o}},logout(){const e=t.getState().auth.user,r=t.getState().auth.session;t.setState(n=>({auth:{status:"anonymous",user:null,role:h.GUEST,session:null}}),{action:"logout"}),e&&a("logout",{actor_id:e.id,actor_type:e.user_type,session_id:r?.session_id,payload:{}})}}}function bt(t,a){function e(){const r=t.getState().auth.role;if(![h.ADMIN,h.SALES_REP].includes(r)){const n=new Error("PERMISSION_DENIED");throw n.code="PERMISSION_DENIED",n}}return{list(){const r=t.getState(),n=r.auth.role,o=r.auth.user;return n===h.ADMIN?r.data.customers:n===h.SALES_REP?r.data.customers.filter(c=>c.sales_rep_id===o?.id||c.created_by_rep_id===o?.id):n===h.CUSTOMER?r.data.customers.filter(c=>c.id===o?.id):[]},create(r){e();const n=t.getState(),o=n.auth.user,c={id:crypto.randomUUID(),name:r.name,phone:r.phone||null,address:r.address||"",location:r.location||"",username:r.username||r.phone||r.name,password:r.password||"1234",created_at:new Date().toISOString(),sales_rep_id:r.sales_rep_id||(n.auth.role===h.SALES_REP?o?.id:null),created_by:o?.id||null,customer_type:r.customer_type||(r.sales_rep_id?"rep_customer":"direct"),created_by_rep_id:n.auth.role===h.SALES_REP?o?.id:r.created_by_rep_id||null,is_active:!0,default_tier_name:r.default_tier_name||"base",is_blocked:!1,blocked_reason:null};return t.setState(s=>({data:{customers:[c,...s.data.customers]}}),{action:"create_customer"}),a("customer_creation",{actor_id:o?.id,actor_type:o?.user_type,session_id:n.auth.session?.session_id,payload:{customer_id:c.id}}),c},update(r,n){e();const c=t.getState().data.customers.map(s=>s.id===r?{...s,...n}:s);return t.setState({data:{customers:c}},{action:"update_customer"}),c.find(s=>s.id===r)||null},reassignCustomers(r,n=[]){e();const o=t.getState().data.customers.map(c=>n.includes(c.id)?{...c,sales_rep_id:r,customer_type:"rep_customer"}:c);return t.setState({data:{customers:o}},{action:"reassign_customers"}),o}}}function ft(t,a){function e(n,o={}){t.setState(c=>({cart:n(c.cart,c)}),o)}function r(n){return{key:`${n.product_id}:${n.unit_code}:${n.tier_name}`,product_id:n.product_id,product_name_snapshot:n.product_name,unit_code_snapshot:n.unit_code,tier_snapshot:n.tier_name,unit_price_snapshot:n.final_price,quantity:1,line_total:n.final_price,pricing_snapshot:lt(n),kind:"product"}}return{reconcilePricing(){const n=t.getState(),c=n.cart.items.map(s=>{if(s.kind!=="product")return s;const l=yt(n.data.products,s.product_id,s.unit_code_snapshot,s.tier_snapshot)||n.data.products.find(p=>p.product_id===s.product_id);if(!l)return s;const d=r(l);return{...s,unit_price_snapshot:d.unit_price_snapshot,tier_snapshot:l.tier_name,pricing_snapshot:d.pricing_snapshot,line_total:d.unit_price_snapshot*s.quantity}});e(s=>({...s,items:c}))},addProduct(n,o=1){const c=t.getState(),s=c.cart.items.find(d=>d.kind==="product"&&d.product_id===n.product_id&&d.unit_code_snapshot===n.unit_code&&d.tier_snapshot===n.tier_name);let l;s?l=c.cart.items.map(d=>d===s?{...d,quantity:d.quantity+o,line_total:d.unit_price_snapshot*(d.quantity+o)}:d):l=[...c.cart.items,{...r(n),quantity:o,line_total:n.final_price*o}],e(d=>({...d,items:l,updated_at:new Date().toISOString()}),{action:"add_to_cart"}),a("add_to_cart",{actor_id:c.auth.user?.id,actor_type:c.auth.user?.user_type||c.auth.role,session_id:c.auth.session?.session_id,payload:{product_id:n.product_id,quantity:o}})},addOffer(n,o){const c=t.getState(),s=`${o}:${n.id}`,l=c.cart.items.find(S=>S.key===s),d={key:s,kind:"offer",offer_kind:o,offer_id:n.id,product_id:`offer-${o}-${n.id}`,product_name_snapshot:n.title,unit_code_snapshot:"offer",tier_snapshot:"base",unit_price_snapshot:Number(n.price||0),quantity:1,line_total:Number(n.price||0),pricing_snapshot:{final_price:Number(n.price||0),title:n.title}},p=l?c.cart.items:[...c.cart.items,d];e(S=>({...S,items:p,updated_at:new Date().toISOString()}),{action:"add_offer"}),a("add_to_cart",{actor_id:c.auth.user?.id,actor_type:c.auth.user?.user_type||c.auth.role,session_id:c.auth.session?.session_id,payload:{offer_id:n.id,kind:o}})},setQuantity(n,o){e(c=>{const s=c.items.map(l=>l.key===n?{...l,quantity:Math.max(1,o),line_total:l.unit_price_snapshot*Math.max(1,o)}:l);return{...c,items:s,updated_at:new Date().toISOString()}},{action:"quantity_change"}),a("quantity_change",{actor_id:t.getState().auth.user?.id,actor_type:t.getState().auth.user?.user_type||t.getState().auth.role,session_id:t.getState().auth.session?.session_id,payload:{key:n,quantity:o}})},remove(n){e(o=>({...o,items:o.items.filter(c=>c.key!==n),updated_at:new Date().toISOString()}),{action:"remove_from_cart"}),a("remove_from_cart",{actor_id:t.getState().auth.user?.id,actor_type:t.getState().auth.user?.user_type||t.getState().auth.role,session_id:t.getState().auth.session?.session_id,payload:{key:n}})},clear(){e(n=>({...n,items:[],updated_at:new Date().toISOString()}),{action:"clear_cart"})}}}const vt={draft:["submitted","cancelled"],submitted:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","cancelled"],shipped:["delivered"],delivered:[],cancelled:[]};function gt(t,a,e){function r(s){const d=t.getState().data.products.map(p=>{const S=s.find(f=>f.kind==="product"&&f.product_id===p.product_id&&f.unit_code_snapshot===p.unit_code&&f.tier_snapshot===p.tier_name);if(!S)return p;const m=Number(S.quantity||0);return{...p,reserved_qty:Number(p.reserved_qty||0)+m}});t.setState({data:{products:d}},{action:"reserve_inventory"})}function n(s){const d=t.getState().data.products.map(p=>{const S=s.find(f=>f.kind==="product"&&f.product_id===p.product_id&&f.unit_code_snapshot===p.unit_code&&f.tier_snapshot===p.tier_name);if(!S)return p;const m=Number(S.quantity||0);return{...p,reserved_qty:Math.max(0,Number(p.reserved_qty||0)-m)}});t.setState({data:{products:d}},{action:"release_inventory"})}function o(s){const d=t.getState().data.products.map(p=>{const S=s.find(f=>f.kind==="product"&&f.product_id===p.product_id&&f.unit_code_snapshot===p.unit_code&&f.tier_snapshot===p.tier_name);if(!S)return p;const m=Number(S.quantity||0);return{...p,reserved_qty:Math.max(0,Number(p.reserved_qty||0)-m),available_qty:Math.max(0,Number(p.available_qty||0)-m)}});t.setState({data:{products:d}},{action:"deduct_inventory"})}function c(s){return s.data.customers.find(d=>d.id===s.cart.customer_id)||null}return{createFromCart(){const s=t.getState();if(!s.cart.items.length){const m=new Error("VALIDATION_FAILED");throw m.code="VALIDATION_FAILED",m}if(s.auth.role===h.GUEST){const m=new Error("AUTH_REQUIRED");throw m.code="AUTH_REQUIRED",m}const d=c(s);if(!d||d.is_blocked){const m=new Error("VALIDATION_FAILED");throw m.code="VALIDATION_FAILED",m}for(const m of s.cart.items){if(m.kind!=="product")continue;const f=s.data.products.find(q=>q.product_id===m.product_id&&q.unit_code===m.unit_code_snapshot&&q.tier_name===m.tier_snapshot);if(!f){const q=new Error("PRODUCT_NOT_SELLABLE");throw q.code="PRODUCT_NOT_SELLABLE",q}const R=Number(f.available_qty||0)-Number(f.reserved_qty||0);if(!f.allow_backorder&&R<m.quantity){const q=new Error("INVENTORY_INSUFFICIENT");throw q.code="INVENTORY_INSUFFICIENT",q}}const p=s.cart.items.reduce((m,f)=>m+Number(f.line_total||0),0),S={id:crypto.randomUUID(),order_number:`ORD-${new Date().getFullYear()}-${String((s.data.orders.length||0)+1).padStart(4,"0")}`,customer_id:d.id,sales_rep_id:s.auth.role===h.SALES_REP?s.auth.user?.id||null:d.sales_rep_id||null,status:"submitted",payment_status:"unpaid",currency:"EGP",subtotal:p,discount_total:0,grand_total:p,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),version:1,items:s.cart.items.map(m=>({product_id:m.product_id,product_name_snapshot:m.product_name_snapshot,unit_code_snapshot:m.unit_code_snapshot,tier_snapshot:m.tier_snapshot,unit_price_snapshot:m.unit_price_snapshot,quantity:m.quantity,line_total:m.line_total,pricing_snapshot:m.pricing_snapshot})),audit:[]};return r(s.cart.items),t.setState(m=>({data:{orders:[S,...m.data.orders]},cart:{...m.cart,items:[]}}),{action:"create_order"}),e("order_creation",{actor_id:s.auth.user?.id,actor_type:s.auth.user?.user_type||s.auth.role,session_id:s.auth.session?.session_id,payload:{order_id:S.id,total:S.grand_total}}),S},list(){const s=t.getState(),l=s.auth.role,d=s.auth.user;return l===h.ADMIN?s.data.orders:l===h.SALES_REP?s.data.orders.filter(p=>p.sales_rep_id===d?.id||p.customer_id===s.cart.customer_id):l===h.CUSTOMER?s.data.orders.filter(p=>p.customer_id===d?.id):[]},get(s){return t.getState().data.orders.find(l=>l.id===s)||null},updateStatus(s,l){const d=t.getState(),p=d.data.orders.find(f=>f.id===s);if(!p)throw Object.assign(new Error("ORDER_NOT_FOUND"),{code:"ORDER_NOT_FOUND"});if(!(vt[p.status]||[]).includes(l))throw Object.assign(new Error("ORDER_ALREADY_FINALIZED"),{code:"ORDER_ALREADY_FINALIZED"});l==="cancelled"&&n(p.items),l==="shipped"&&o(p.items);const m=d.data.orders.map(f=>f.id===s?{...f,status:l,updated_at:new Date().toISOString(),version:(f.version||1)+1}:f);t.setState({data:{orders:m}},{action:"update_order_status"}),e("representative_action",{actor_id:d.auth.user?.id,actor_type:d.auth.user?.user_type||d.auth.role,session_id:d.auth.session?.session_id,payload:{action:"update_order_status",order_id:s,nextStatus:l}})},editItems(s,l){const d=t.getState(),p=d.data.orders.find(m=>m.id===s);if(!p)throw Object.assign(new Error("ORDER_NOT_FOUND"),{code:"ORDER_NOT_FOUND"});if(!["draft","submitted"].includes(p.status))throw Object.assign(new Error("ORDER_ALREADY_FINALIZED"),{code:"ORDER_ALREADY_FINALIZED"});const S=d.data.orders.map(m=>m.id===s?{...m,items:l,updated_at:new Date().toISOString(),version:(m.version||1)+1}:m);t.setState({data:{orders:S}},{action:"edit_order_items"})},whatsappMessage(s){const l=t.getState().data.customers.find(p=>p.id===s.customer_id),d=[`فاتورة/طلب رقم: ${s.order_number}`,`العميل: ${l?.name||s.customer_id}`,`الحالة: ${s.status}`,"---"];for(const p of s.items||[])d.push(`${p.product_name_snapshot} × ${p.quantity} = ${w(p.line_total)} ج.م`);return d.push("---"),d.push(`الإجمالي: ${w(s.grand_total)} ج.م`),d.join(`
`)}}}function St(t,a){return{daily(){return t.getState().data.dailyDeals||[]},flash(){return t.getState().data.flashOffers||[]},recordOpen(e,r){a("company_open",{actor_id:t.getState().auth.user?.id,actor_type:t.getState().auth.user?.user_type||t.getState().auth.role,session_id:t.getState().auth.session?.session_id,payload:{kind:e,id:r}})}}}function $t(t){return{summary(){const a=t.getState(),e=a.data.orders||[],r=a.data.customers||[],n=a.data.products||[],o=e.reduce((l,d)=>l+Number(d.grand_total||0),0),c=e.filter(l=>l.status==="submitted").length,s=e.filter(l=>l.status==="shipped"||l.status==="delivered").length;return{revenue:o,orders:e.length,customers:r.length,products:n.length,submitted:c,shipped:s}},repPerformance(){const a=t.getState();return a.data.authUsers.filter(r=>r.user_type==="sales_rep").map(r=>({id:r.id,name:r.name,orders:a.data.orders.filter(n=>n.sales_rep_id===r.id).length,customers:a.data.customers.filter(n=>n.sales_rep_id===r.id||n.created_by_rep_id===r.id).length}))}}}const i={q(t,a=document){return a.querySelector(t)},qa(t,a=document){return Array.from(a.querySelectorAll(t))},html(t,a){t&&(t.innerHTML=a)},text(t,a){t&&(t.textContent=a)},escape(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}};function x(t){return t.auth?.role||h.GUEST}function Et(t){return[{company_id:"all",company_name:"جميع الشركات",company_logo:null,color:"#999"},...t.data.companies||[]]}function z(t){return t.data.tiers.find(a=>a.tier_name===t.ui.selectedTier)||t.data.tiers.find(a=>a.is_default)||t.data.tiers[0]||null}function qt(t){const a=(t.ui.search||"").trim().toLowerCase(),e=t.ui.selectedTier,r=t.ui.selectedCompany;let n=(t.data.products||[]).filter(o=>o.runtime_healthy!==!1);return e&&e!=="all"&&(n=n.filter(o=>o.tier_name===e)),r&&r!=="all"&&(n=n.filter(o=>o.company_id===r)),a&&(n=n.filter(o=>[o.product_name,o.company_name,o.product_id,o.category].some(c=>String(c||"").toLowerCase().includes(a)))),n.slice().sort((o,c)=>String(o.company_name).localeCompare(String(c.company_name),"ar")||String(o.product_name).localeCompare(String(c.product_name),"ar"))}function X(t){const a=Z(qt(t));return{products:a,companies:Et(t),tiers:t.data.tiers||[],counts:{products:a.length,companies:(t.data.companies||[]).length,orders:(t.data.orders||[]).length,customers:(t.data.customers||[]).length}}}function wt(t){return t.cart.items||[]}function F(t){const a=wt(t),e=a.reduce((n,o)=>n+(o.unit_price_snapshot||o.unit_price||0)*o.quantity,0),r=a.reduce((n,o)=>n+o.quantity,0);return{subtotal:e,quantity:r,grand_total:e,discount_total:0}}function Dt(t){const a=x(t),e=t.auth.user;return a===h.ADMIN?t.data.customers||[]:a===h.SALES_REP?(t.data.customers||[]).filter(r=>r.sales_rep_id===e?.id||r.created_by_rep_id===e?.id):a===h.CUSTOMER?(t.data.customers||[]).filter(r=>r.id===e?.id||r.username===e?.username):[]}const kt=new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"});function B(t){try{return kt.format(new Date(t||Date.now()))}catch{return""}}function It(t){const a=[{route:"home",label:"الرئيسية",icon:"⌂"},{route:"offers",label:"العروض",icon:"✦"},{route:"cart",label:"السلة",icon:"🛒"}];return t===h.GUEST?[...a,{route:"login",label:"الدخول",icon:"⇢"}]:t===h.CUSTOMER?[...a,{route:"orders",label:"طلباتي",icon:"▤"},{route:"account",label:"الحساب",icon:"◔"}]:t===h.SALES_REP?[...a,{route:"customers",label:"العملاء",icon:"◫"},{route:"orders",label:"الطلبات",icon:"▤"},{route:"analytics",label:"التحليلات",icon:"⟡"}]:[...a,{route:"customers",label:"العملاء",icon:"◫"},{route:"reps",label:"المناديب",icon:"⚇"},{route:"orders",label:"الطلبات",icon:"▤"},{route:"analytics",label:"التحليلات",icon:"⟡"},{route:"settings",label:"الإعدادات",icon:"⚙"}]}function k(t,a=""){return`<span class="badge ${a}">${i.escape(t)}</span>`}function tt(t,a=!1){const e=t.color?`style="--chip-accent:${t.color}"`:"";return`<button class="company-chip ${a?"is-active":""}" ${e} type="button" data-action="select-company" data-company-id="${i.escape(t.company_id)}"><span>${i.escape((t.company_name||"X").slice(0,1))}</span><strong>${i.escape(t.company_name)}</strong></button>`}function Ot(t,a=!1){return`<button class="tier-chip ${a?"is-active":""}" type="button" data-action="select-tier" data-tier-name="${i.escape(t.tier_name)}">${i.escape(t.display_name||t.tier_name)}</button>`}function Nt(t,a){const e=t.units?.[0];a.cart.items.some(d=>d.kind==="product"&&d.product_id===t.product_id);const r=e?Math.max(0,e.available_qty-e.reserved_qty):0,n=e?.unit_code||"carton",o=e?.final_price||0,c=`${t.product_id}:${n}:${e?.tier_name||"base"}`,l=a.cart.items.find(d=>d.key===c||d.kind==="product"&&d.product_id===t.product_id)?.quantity||1;return`
    <article class="product-card" data-product-id="${i.escape(t.product_id)}">
      <button type="button" class="product-card__hero" data-action="open-product" data-product-id="${i.escape(t.product_id)}">
        <div class="product-card__thumb" style="--company-accent:${i.escape(t.color||"#999")}">
          <span>${i.escape((t.company_name||"P").slice(0,1))}</span>
        </div>
        <div class="product-card__head">
          <strong>${i.escape(t.product_name)}</strong>
          <span>${i.escape(t.company_name||"")}</span>
        </div>
      </button>
      <div class="product-card__meta">
        ${k(_t(n))}
        ${k(`المتاح ${r}`,r>0?"badge--success":"badge--danger")}
        ${k(i.escape(t.tier_name))}
      </div>
      <div class="product-card__price">
        <strong>${w(o)} ج.م</strong>
        <span>${i.escape(t.product_id)}</span>
      </div>
      <div class="qty-control" aria-label="quantity">
        <button type="button" data-action="set-cart-qty" data-product-key="${i.escape(c)}" data-delta="-1">−</button>
        <input data-role="cart-qty" data-product-key="${i.escape(c)}" value="${l}" inputmode="numeric" pattern="[0-9]*" />
        <button type="button" data-action="set-cart-qty" data-product-key="${i.escape(c)}" data-delta="1">+</button>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary" data-action="add-product" data-product-id="${i.escape(t.product_id)}" data-unit-code="${i.escape(n)}" data-tier-name="${i.escape(e?.tier_name||t.tier_name)}">إضافة للسلة</button>
        <button type="button" class="btn btn--ghost" data-action="open-product" data-product-id="${i.escape(t.product_id)}">تفاصيل</button>
      </div>
    </article>
  `}function V(t,a){const e=t.can_buy!==!1;return`
    <article class="offer-card offer-card--${i.escape(a)}">
      <div class="offer-card__body">
        <div class="offer-card__meta">${k(a==="daily"?"يومي":"فلاش",a==="daily"?"badge--info":"badge--warning")} ${k(e?"متاح":"مغلق",e?"badge--success":"badge--danger")}</div>
        <h3>${i.escape(t.title)}</h3>
        <p>${i.escape(t.description||"")}</p>
        <div class="offer-card__foot">
          <strong>${w(t.price)} ج.م</strong>
          <button type="button" class="btn btn--primary" data-action="add-offer" data-offer-kind="${i.escape(a)}" data-offer-id="${i.escape(t.id)}" ${e?"":"disabled"}>إضافة</button>
        </div>
      </div>
    </article>
  `}function At(t,a){const e=a.data.customers.find(r=>r.id===t.customer_id);return`
    <article class="order-card">
      <div class="order-card__top">
        <div>
          <strong>#${i.escape(t.order_number)}</strong>
          <span>${i.escape(e?.name||"عميل غير معروف")}</span>
        </div>
        ${k(t.status,t.status==="cancelled"?"badge--danger":"badge--info")}
      </div>
      <div class="order-card__items">
        ${(t.items||[]).slice(0,2).map(r=>`<div class="order-line">${i.escape(r.product_name_snapshot)} × ${r.quantity} — ${w(r.line_total)} ج.م</div>`).join("")}
      </div>
      <div class="order-card__foot">
        <strong>${w(t.grand_total)} ج.م</strong>
        <span>${B(t.created_at)}</span>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="open-order" data-order-id="${i.escape(t.id)}">فتح</button>
        <button type="button" class="btn btn--primary" data-action="send-whatsapp" data-order-id="${i.escape(t.id)}">واتساب</button>
      </div>
    </article>
  `}function Ct(t,a=!1){return`
    <article class="customer-card ${a?"is-selected":""}">
      <div class="customer-card__top">
        <div>
          <strong>${i.escape(t.name)}</strong>
          <span>${i.escape(t.phone||"بدون هاتف")}</span>
        </div>
        ${a?k("مختار","badge--success"):""}
      </div>
      <div class="customer-card__meta">${i.escape(t.location||t.address||"")}</div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="select-customer" data-customer-id="${i.escape(t.id)}">${a?"محدد":"اختيار"}</button>
      </div>
    </article>
  `}function et(t){return`
    <article class="rep-card">
      <div class="rep-card__top">
        <div>
          <strong>${i.escape(t.name)}</strong>
          <span>${i.escape(t.username||t.phone||"")}</span>
        </div>
        ${k(t.is_blocked?"موقوف":"نشط",t.is_blocked?"badge--danger":"badge--success")}
      </div>
      <div class="rep-card__meta">${i.escape(t.login_code||"")}</div>
    </article>
  `}function g(t,a){return`
    <article class="summary-card">
      <span>${i.escape(t)}</span>
      <strong>${i.escape(String(a))}</strong>
    </article>
  `}function Tt(t){const a=X(t),e=z(t),r=a.products.slice(0,t.ui.visibleCount),n=a.products.length;return`
    <section class="hero">
      <div class="hero__copy">
        <div class="hero__eyebrow">${k("Mobile-first","badge--info")} ${k("Render-only runtime","badge--success")}</div>
        <h1>${i.escape(t.data.settings.hero_title||"B2B Commerce")}</h1>
        <p>${i.escape(t.data.settings.hero_subtitle||"Authoritative commerce runtime.")}</p>
        <div class="hero__stats">
          ${g("المنتجات",a.counts.products)}
          ${g("الشركات",a.counts.companies)}
          ${g("الطلبات",a.counts.orders)}
          ${g("الشرائح",t.data.tiers.length)}
        </div>
      </div>
      <div class="hero__panel">
        <div class="hero__panel-row">
          <strong>الشريحة الحالية</strong>
          <span>${i.escape(e?.display_name||e?.tier_name||"")}</span>
        </div>
        <div class="hero__panel-row">
          <strong>الوضع</strong>
          <span>${i.escape(t.auth.role)}</span>
        </div>
        <div class="hero__panel-row">
          <strong>السلة</strong>
          <span>${t.cart.items.length} بند</span>
        </div>
        <button type="button" class="btn btn--primary full" data-action="go" data-route="cart">فتح السلة</button>
      </div>
    </section>

    <section class="section">
      <div class="section__head">
        <div>
          <h2>الشركات</h2>
          <p>مرشح سريع للشركات النشطة.</p>
        </div>
        <button type="button" class="btn btn--ghost" data-action="go" data-route="offers">العروض</button>
      </div>
      <div class="chips chips--companies">
        ${a.companies.map(o=>tt(o,t.ui.selectedCompany===o.company_id)).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section__head">
        <div>
          <h2>المنتجات</h2>
          <p>${n?`عرض ${Math.min(r.length,n)} من ${n}`:"لا توجد نتائج."}</p>
        </div>
        <button type="button" class="btn btn--ghost" data-action="load-more">تحميل المزيد</button>
      </div>
      <div class="product-grid">
        ${r.map(o=>Nt(o,t)).join("")||'<div class="empty">لا توجد منتجات مطابقة.</div>'}
      </div>
    </section>
  `}function Rt(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>العروض اليومية</h2><p>Entities منفصلة وليست جزءًا من pricing engine.</p></div>
      </div>
      <div class="offer-grid">
        ${(t.data.dailyDeals||[]).map(a=>V(a,"daily")).join("")}
      </div>
    </section>
    <section class="section">
      <div class="section__head">
        <div><h2>العروض الفلاش</h2><p>حالة العرض تُدار من runtime view.</p></div>
      </div>
      <div class="offer-grid">
        ${(t.data.flashOffers||[]).map(a=>V(a,"flash")).join("")}
      </div>
    </section>
  `}function Ut(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>الشرائح الظاهرة</h2><p>تحميل مباشر من العقد الرسمية.</p></div>
      </div>
      <div class="tier-grid">
        ${(t.data.tiers||[]).map(a=>`
          <article class="tier-card ${t.ui.selectedTier===a.tier_name?"is-active":""}">
            <div class="tier-card__top">
              <div>
                <strong>${i.escape(a.display_name||a.tier_name)}</strong>
                <span>Min order ${w(a.min_order||0)} ج.م</span>
              </div>
              ${k(a.is_default?"افتراضية":"إضافية",a.is_default?"badge--success":"badge--info")}
            </div>
            <button type="button" class="btn btn--primary" data-action="select-tier" data-tier-name="${i.escape(a.tier_name)}">${t.ui.selectedTier===a.tier_name?"محدد":"اختيار"}</button>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Lt(t){const a=F(t),e=t.data.customers.find(r=>r.id===t.cart.customer_id);return`
    <section class="section">
      <div class="section__head">
        <div><h2>السلة</h2><p>حفظ محلي مؤقت مع snapshot للأسعار.</p></div>
        <button type="button" class="btn btn--ghost" data-action="clear-cart">تفريغ</button>
      </div>
      <div class="cart-summary">
        <div class="cart-summary__row"><span>العميل</span><strong>${i.escape(e?.name||"غير محدد")}</strong></div>
        <div class="cart-summary__row"><span>البنود</span><strong>${a.quantity}</strong></div>
        <div class="cart-summary__row"><span>الإجمالي</span><strong>${w(a.grand_total)} ج.م</strong></div>
      </div>
      <div class="cart-list">
        ${(t.cart.items||[]).map(r=>`
          <article class="cart-item">
            <div>
              <strong>${i.escape(r.product_name_snapshot)}</strong>
              <div class="cart-item__meta">${i.escape(r.unit_code_snapshot)} · ${i.escape(r.tier_snapshot)}</div>
              <div class="cart-item__meta">${w(r.unit_price_snapshot)} ج.م</div>
            </div>
            <div class="cart-item__actions">
              <div class="qty-control qty-control--small">
                <button type="button" data-action="set-cart-qty" data-product-key="${i.escape(r.key)}" data-delta="-1">−</button>
                <input data-role="cart-qty" data-product-key="${i.escape(r.key)}" value="${r.quantity}" inputmode="numeric" />
                <button type="button" data-action="set-cart-qty" data-product-key="${i.escape(r.key)}" data-delta="1">+</button>
              </div>
              <button type="button" class="btn btn--ghost" data-action="remove-cart-item" data-product-key="${i.escape(r.key)}">حذف</button>
            </div>
          </article>
        `).join("")||'<div class="empty">السلة فارغة.</div>'}
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary full" data-action="go" data-route="checkout" ${t.cart.items.length?"":"disabled"}>متابعة للدفع</button>
        <button type="button" class="btn btn--ghost full" data-action="go" data-route="home">متابعة التسوق</button>
      </div>
    </section>
  `}function Mt(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>الطلبات</h2><p>عرض الحالة من سجل أوامر التشغيل.</p></div>
      </div>
      <div class="order-grid">
        ${(t.data.orders||[]).map(e=>At(e,t)).join("")||'<div class="empty">لا توجد طلبات.</div>'}
      </div>
    </section>
  `}function Pt(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>العملاء</h2><p>عرض مقيد حسب الدور.</p></div>
      </div>
      <form class="inline-form" data-form="customer-create">
        <input name="name" placeholder="اسم العميل" required />
        <input name="phone" placeholder="الهاتف" />
        <input name="location" placeholder="الموقع" />
        <button class="btn btn--primary" type="submit">إضافة</button>
      </form>
      <div class="customer-grid">
        ${Dt(t).map(e=>Ct(e,t.cart.customer_id===e.id)).join("")||'<div class="empty">لا يوجد عملاء.</div>'}
      </div>
    </section>
  `}function xt(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>المناديب</h2><p>قائمة تشغيلية لا تعتمد على UI logic.</p></div>
      </div>
      <div class="rep-grid">
        ${(t.data.authUsers||[]).filter(e=>e.user_type===h.SALES_REP).map(e=>et(e)).join("")}
      </div>
    </section>
  `}function Ft(t,a){const e=a.analytics.summary();return`
    <section class="section">
      <div class="section__head">
        <div><h2>التحليلات</h2><p>لوحة قراءات مشتقة من سجل التشغيل.</p></div>
      </div>
      <div class="summary-grid">
        ${g("الإيراد",`${w(e.revenue)} ج.م`)}
        ${g("الطلبات",e.orders)}
        ${g("العملاء",e.customers)}
        ${g("المنتجات",e.products)}
        ${g("submitted",e.submitted)}
        ${g("shipped/delivered",e.shipped)}
      </div>
      <div class="section section--compact">
        <div class="section__head"><div><h3>أداء المناديب</h3></div></div>
        <div class="rep-grid">
          ${a.analytics.repPerformance().map(r=>et(r)).join("")}
        </div>
      </div>
    </section>
  `}function Bt(t){const a=t.auth.role!==h.GUEST;return`
    <section class="section">
      <div class="section__head">
        <div><h2>${a?"الحساب":"الدخول"}</h2><p>${a?"جلسة محفوظة محليًا.":"استخدم username أو phone أو login_code مع كلمة المرور."}</p></div>
      </div>
      ${a?`
        <div class="summary-grid">
          ${g("الدور",t.auth.role)}
          ${g("المستخدم",t.auth.user?.name||"")}
          ${g("انتهاء الجلسة",B(t.auth.session?.expires_at))}
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn--primary" data-action="logout">تسجيل الخروج</button>
        </div>
      `:`
        <form class="auth-form" data-form="login">
          <input name="identity" placeholder="username / phone / login_code" required />
          <input name="password" type="password" placeholder="password" required />
          <button class="btn btn--primary full" type="submit">دخول</button>
        </form>
      `}
    </section>
  `}function Gt(t,a){const e=F(t),r=t.data.customers.find(n=>n.id===t.cart.customer_id);return`
    <section class="section">
      <div class="section__head">
        <div><h2>الدفع</h2><p>إنشاء الطلب من snapshot محفوظ.</p></div>
      </div>
      <div class="checkout-box">
        <div class="checkout-box__row"><span>العميل</span><strong>${i.escape(r?.name||"غير محدد")}</strong></div>
        <div class="checkout-box__row"><span>البنود</span><strong>${e.quantity}</strong></div>
        <div class="checkout-box__row"><span>الإجمالي</span><strong>${w(e.grand_total)} ج.م</strong></div>
        <div class="checkout-box__row"><span>الدفع</span><strong>COD</strong></div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--primary full" data-action="submit-checkout" ${t.cart.items.length?"":"disabled"}>إنشاء الطلب</button>
        <button type="button" class="btn btn--ghost full" data-action="go" data-route="cart">رجوع للسلة</button>
      </div>
    </section>
  `}function jt(t){return`
    <section class="section">
      <div class="section__head">
        <div><h2>الإعدادات</h2><p>Theme + runtime configuration.</p></div>
      </div>
      <div class="summary-grid">
        ${g("Theme",t.ui.theme)}
        ${g("WhatsApp",t.app.config.supportWhatsapp)}
        ${g("Source",t.runtime.source)}
        ${g("Sync",B(t.runtime.lastSyncAt))}
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn--ghost" data-action="toggle-theme">تبديل الثيم</button>
      </div>
    </section>
  `}function Ht(t,a){switch(t.ui.route){case"offers":return Rt(t);case"tiers":return Ut(t);case"cart":return Lt(t);case"orders":return Mt(t);case"customers":return Pt(t);case"reps":return xt(t);case"analytics":return Ft(t,a);case"login":case"account":return Bt(t);case"checkout":return Gt(t);case"settings":return jt(t);case"home":default:return Tt(t)}}function Kt(t,a){if(!t.ui.modal)return"";const e=t.ui.modal;if(e.type==="product"){const r=e.product;return`
      <section class="modal is-open" data-modal="product">
        <div class="modal__sheet">
          <div class="modal__head">
            <strong>${i.escape(r.product_name)}</strong>
            <button type="button" class="icon-btn" data-action="close-modal">×</button>
          </div>
          <div class="modal__body">
            <div class="summary-grid">
              ${g("الشركة",r.company_name||"")}
              ${g("الشريحة",r.tier_name||"")}
              ${g("السعر",`${w(r.units?.[0]?.final_price||0)} ج.م`)}
              ${g("المتاح",r.units?.[0]?Math.max(0,r.units[0].available_qty-r.units[0].reserved_qty):0)}
            </div>
            <p class="muted">${i.escape(r.category||"")}</p>
          </div>
          <div class="modal__foot">
            <button type="button" class="btn btn--primary" data-action="add-product" data-product-id="${i.escape(r.product_id)}" data-unit-code="${i.escape(r.units?.[0]?.unit_code||"carton")}" data-tier-name="${i.escape(r.units?.[0]?.tier_name||"base")}">إضافة للسلة</button>
          </div>
        </div>
      </section>
    `}if(e.type==="order"){const r=e.order;return`
      <section class="modal is-open" data-modal="order">
        <div class="modal__sheet">
          <div class="modal__head">
            <strong>#${i.escape(r.order_number)}</strong>
            <button type="button" class="icon-btn" data-action="close-modal">×</button>
          </div>
          <div class="modal__body">
            <div class="summary-grid">
              ${g("الحالة",r.status)}
              ${g("الإجمالي",`${w(r.grand_total)} ج.م`)}
              ${g("العميل",r.customer_id)}
              ${g("المندوب",r.sales_rep_id||"-")}
            </div>
            <div class="order-lines">
              ${(r.items||[]).map(n=>`<div class="order-line">${i.escape(n.product_name_snapshot)} × ${n.quantity} — ${w(n.line_total)} ج.م</div>`).join("")}
            </div>
          </div>
          <div class="modal__foot">
            <button type="button" class="btn btn--primary" data-action="send-whatsapp" data-order-id="${i.escape(r.id)}">واتساب</button>
          </div>
        </div>
      </section>
    `}return""}function Vt(t){return`<div class="toast-stack">${t.data.uiEvents.slice(-3).map((e,r)=>`
    <article class="toast toast--${i.escape(e.event_type||"info")}">
      <strong>${i.escape(e.event_type)}</strong>
      <span>${i.escape(e.payload?JSON.stringify(e.payload).slice(0,120):"")}</span>
    </article>
  `).join("")}</div>`}function Yt(t,a){return`
    <nav class="bottom-nav" aria-label="main navigation">
      ${It(x(t)).map(r=>`<button type="button" class="bottom-nav__item ${t.ui.route===r.route?"is-active":""}" data-action="go" data-route="${i.escape(r.route)}"><span>${i.escape(r.icon)}</span><strong>${i.escape(r.label)}</strong></button>`).join("")}
    </nav>
  `}function Qt(t,a){const e=X(t),r=x(t),n=z(t);return`
    <div class="app-shell theme-${i.escape(t.ui.theme||"dark")}" data-role="${i.escape(r)}">
      <header class="topbar">
        <div class="topbar__row">
          <div class="brand">
            <div class="brand__mark">A</div>
            <div>
              <strong>${i.escape(t.app.config.appName||"الأهرام B2B")}</strong>
              <span>${i.escape(t.runtime.source)}</span>
            </div>
          </div>
          <div class="topbar__actions">
            <button type="button" class="icon-btn" data-action="toggle-theme">◐</button>
            <button type="button" class="btn btn--ghost" data-action="go" data-route="${t.auth.role===h.GUEST?"login":"account"}">${t.auth.role===h.GUEST?"دخول":i.escape(t.auth.user?.name||"الحساب")}</button>
          </div>
        </div>

        <div class="search-bar">
          <input id="searchInput" type="search" value="${i.escape(t.ui.search||"")}" placeholder="بحث في المنتجات والشركات..." data-action="search" />
          <button type="button" class="btn btn--ghost" data-action="clear-search">مسح</button>
        </div>

        <div class="tier-strip" aria-label="tiers">
          ${t.data.tiers.map(o=>Ot(o,n?.tier_name===o.tier_name)).join("")}
        </div>

        <div class="company-strip">
          ${e.companies.map(o=>tt(o,t.ui.selectedCompany===o.company_id)).join("")}
        </div>
      </header>

      <main class="content">
        ${Ht(t,a)}
      </main>

      <button type="button" class="floating-cart" data-action="go" data-route="cart">
        <span>🛒</span>
        <strong>${t.cart.items.length}</strong>
        <em>${w(F(t).grand_total)} ج.م</em>
      </button>

      ${Yt(t)}
      ${Kt(t)}
      ${Vt(t)}
    </div>
  `}const Y="ahram-b2b-runtime:theme";async function Wt(){const t=st(),a=ut(t),e=ct(t),r=document.getElementById("app"),n=(y,u={})=>{const b=e.getState(),v={event_type:y,actor_id:u.actor_id||b.auth.user?.id||null,actor_type:u.actor_type||b.auth.user?.user_type||b.auth.role,session_id:u.session_id||b.auth.session?.session_id||null,timestamp:new Date().toISOString(),payload:u.payload||{},source:"ui",runtime_context:{route:b.ui.route,theme:b.ui.theme,cart_count:b.cart.items.length}};return e.setState(_=>({data:{uiEvents:[..._.data.uiEvents,v].slice(-200)}}),{action:y}),v},o=ht(e,n),c=bt(e,n),s=ft(e,n),l=gt(e,s,n),d=St(e,n),p=$t(e);async function S(){const y=await a.bootstrap(),u={...y,products:pt(y.products||[]),companies:mt(y.products||[]),productsIndex:Z(y.products||[])};e.setState(_=>({app:{ready:!0,online:!0,config:t},data:{..._.data,...u},ui:{..._.ui,theme:_.ui.theme||W(Y,t.theme||"dark"),route:M().path}}),{action:"hydrate"});const v=e.getState().auth.session;v?.expires_at&&new Date(v.expires_at).getTime()<Date.now()&&o.logout(),s.reconcilePricing()}function m(){const y=e.getState().ui.theme||"dark";document.documentElement.dataset.theme=y,document.body.dataset.theme=y,J(Y,y)}function f(y){e.setState(u=>({ui:{...u.ui,modal:y}}),{action:"open_modal"})}function R(){e.setState(y=>({ui:{...y.ui,modal:null}}),{action:"close_modal"})}function q(y){e.setState(u=>({ui:{...u.ui,route:y}}),{action:"route"})}function G(){r&&(r.innerHTML=Qt(e.getState(),{analytics:p}),m())}function at(y){const u=e.getState(),b=u.data.productsIndex?.find(v=>v.product_id===y);return b||u.data.products.find(v=>v.product_id===y)||null}function rt(y,u){const b=e.getState();return(y==="daily"?b.data.dailyDeals:b.data.flashOffers).find(_=>String(_.id)===String(u))||null}function U(y){const u=e.getState().auth.role||h.GUEST;return y==="login"&&u!==h.GUEST?"account":y==="customers"&&![h.ADMIN,h.SALES_REP].includes(u)||y==="reps"&&u!==h.ADMIN||y==="analytics"&&![h.ADMIN,h.SALES_REP].includes(u)?u===h.GUEST?"login":"home":y==="checkout"&&u===h.GUEST?"login":y}window.addEventListener("hashchange",()=>{const{path:y}=M(),u=U(y);u!==y&&N(u),q(u)}),document.addEventListener("click",y=>{const u=y.target.closest("[data-action]");if(!u)return;const b=u.dataset.action,v=e.getState();try{if(b==="go"){const _=U(u.dataset.route);N(_),q(_);return}if(b==="select-tier"){const _=u.dataset.tierName;e.setState($=>({ui:{...$.ui,selectedTier:$.ui.selectedTier===_?"base":_,visibleCount:12}}),{action:"select_tier"}),s.reconcilePricing();return}if(b==="select-company"){const _=u.dataset.companyId;e.setState($=>({ui:{...$.ui,selectedCompany:$.ui.selectedCompany===_?"all":_,visibleCount:12}}),{action:"select_company"}),n("company_open",{payload:{company_id:_}});return}if(b==="load-more"){e.setState(_=>({ui:{..._.ui,visibleCount:_.ui.visibleCount+12}}),{action:"load_more"});return}if(b==="clear-search"){e.setState(_=>({ui:{..._.ui,search:"",visibleCount:12}}),{action:"clear_search"});return}if(b==="toggle-theme"){const _=v.ui.theme==="dark"?"light":"dark";e.setState($=>({ui:{...$.ui,theme:_}}),{action:"toggle_theme"}),m();return}if(b==="logout"){o.logout(),N("home"),q("home");return}if(b==="open-product"){const _=at(u.dataset.productId);_&&f({type:"product",product:_});return}if(b==="close-modal"){R();return}if(b==="add-product"){const _=u.closest("[data-product-id]"),$=u.dataset.productId,I=u.dataset.unitCode,A=u.dataset.tierName,C=v.data.products.find(T=>T.product_id===$&&T.unit_code===I&&T.tier_name===A)||v.data.products.find(T=>T.product_id===$);if(!C)return;const L=_?.querySelector('[data-role="cart-qty"]'),nt=Math.max(1,Number(L?.value||1));s.addProduct(C,nt);return}if(b==="set-cart-qty"){const _=u.dataset.productKey,$=Number(u.dataset.delta||0),I=v.cart.items.find(A=>A.key===_);if(I)s.setQuantity(_,I.quantity+$);else{const A=u.closest("[data-product-id]");if(A){const C=A.querySelector('[data-role="cart-qty"]'),L=Math.max(1,Number(C?.value||1)+$);C&&(C.value=String(L))}}return}if(b==="remove-cart-item"){s.remove(u.dataset.productKey);return}if(b==="clear-cart"){s.clear();return}if(b==="add-offer"){const _=u.dataset.offerKind,$=rt(_,u.dataset.offerId);$&&s.addOffer($,_);return}if(b==="open-order"){const _=l.get(u.dataset.orderId);_&&f({type:"order",order:_});return}if(b==="send-whatsapp"){const _=l.get(u.dataset.orderId);if(!_)return;const $=l.whatsappMessage(_),I=`https://wa.me/${t.supportWhatsapp}?text=${encodeURIComponent($)}`;window.open(I,"_blank","noopener,noreferrer"),n("whatsapp_send",{payload:{order_id:_.id}});return}if(b==="submit-checkout"){const _=l.createFromCart();f({type:"order",order:_}),N("orders"),q("orders");return}if(b==="select-customer"){e.setState(_=>({cart:{..._.cart,customer_id:u.dataset.customerId}}),{action:"select_customer"});return}}catch(_){console.error(_),n("representative_action",{payload:{error:_.code||_.message}}),e.setState($=>({runtime:{...$.runtime,diagnostics:{...$.runtime.diagnostics,hasConsoleError:!0}}}),{action:"error"})}}),document.addEventListener("input",y=>{const u=y.target;if(!(u instanceof HTMLInputElement))return;if(u.dataset.action==="search"){e.setState(v=>({ui:{...v.ui,search:u.value,visibleCount:12}}),{action:"search"}),n("search",{payload:{query:u.value}});return}if(u.dataset.role==="cart-qty"){const v=u.dataset.productKey,_=Math.max(1,Number(u.value||1));e.getState().cart.items.find(I=>I.key===v)?s.setQuantity(v,_):u.value=String(_);return}}),document.addEventListener("submit",y=>{const u=y.target;if(!(u instanceof HTMLFormElement))return;const b=u.dataset.form;y.preventDefault();try{if(b==="login"){const v=new FormData(u);o.login(String(v.get("identity")||""),String(v.get("password")||"")),N("home"),q("home");return}if(b==="customer-create"){const v=new FormData(u),_=c.create({name:String(v.get("name")||"").trim(),phone:String(v.get("phone")||"").trim(),location:String(v.get("location")||"").trim()});u.reset(),_&&e.setState($=>({cart:{...$.cart,customer_id:_.id}}),{action:"select_customer"});return}}catch(v){console.error(v),n("representative_action",{payload:{error:v.code||v.message}})}}),e.subscribe(()=>{G()}),await S();const j=U(M().path);N(j),q(j),G(),window.__B2B_APP__={getState:()=>e.getState(),services:{auth:o,customers:c,cart:s,orders:l,offers:d,analytics:p},navigate:N,eventLog:n}}Wt();
