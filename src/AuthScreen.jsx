import React, { useState } from "react";
import { auth, tokenStore } from "./api.js";
const C = { bg:"#1B1E23",surface:"#242830",border:"#383E48",amber:"#FFC53D",text:"#ECE8DF",muted:"#9099A3",mutedDark:"#666D78",rust:"#FF7A45" };
const inp = { background:"#2A2F38",border:"1px solid #383E48",color:"#ECE8DF",borderRadius:8,padding:"13px 14px",fontSize:15,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"Arial,sans-serif" };
export default function AuthScreen({ onAuth }) {
  const [step,setStep]=useState("phone");
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [name,setName]=useState("");
  const [company,setCompany]=useState("");
  const [role,setRole]=useState("");
  const [savedPhone,setSavedPhone]=useState("");
  const [savedCode,setSavedCode]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [countdown,setCountdown]=useState(0);
  const err=(msg)=>{setError(msg);setLoading(false);};
  async function handleSendCode(){
    setError("");if(!phone.trim())return err("Введите номер телефона");
    setLoading(true);
    try{await auth.sendCode(phone.trim());setSavedPhone(phone.trim());setStep("code");setLoading(false);setCountdown(60);const t=setInterval(()=>setCountdown(c=>{if(c<=1){clearInterval(t);return 0;}return c-1;}),1000);}
    catch(e){err(e.message);}
  }
  async function handleVerify(){
    setError("");if(code.length<4)return err("Введите код из SMS");setLoading(true);
    try{const res=await auth.verify(savedPhone,code.trim());if(res.needsRegistration){setSavedCode(code.trim());setStep("register");setLoading(false);}else{tokenStore.set(res.token);onAuth(res.user);}}
    catch(e){err(e.message);}
  }
  async function handleRegister(){
    setError("");if(!name.trim())return err("Введите имя");if(!role)return err("Выберите роль");setLoading(true);
    try{const res=await auth.register(savedPhone,savedCode,name.trim(),role,company.trim()||undefined);tokenStore.set(res.token);onAuth(res.user);}
    catch(e){err(e.message);}
  }
  const Btn=({onClick,disabled,children,secondary})=>React.createElement("button",{onClick,disabled:disabled||loading,style:{width:"100%",padding:"14px",borderRadius:8,border:secondary?"1px solid #383E48":"none",fontWeight:700,fontSize:15,cursor:disabled||loading?"not-allowed":"pointer",background:secondary?"transparent":disabled||loading?"#2A2F38":C.amber,color:secondary?C.muted:disabled||loading?C.mutedDark:"#1B1E23",fontFamily:"Arial,sans-serif"}},loading?"...":children);
  return React.createElement("div",{style:{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Arial,sans-serif"}},
    React.createElement("div",{style:{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",gap:24}},
      React.createElement("div",{style:{textAlign:"center"}},
        React.createElement("div",{style:{fontSize:32,color:C.amber,fontWeight:700,letterSpacing:".04em"}},"ТРАССА"),
        React.createElement("div",{style:{fontSize:12,color:C.mutedDark,marginTop:4}},"биржа грузоперевозок Казахстан")),
      React.createElement("div",{style:{background:C.surface,borderRadius:12,padding:24,display:"flex",flexDirection:"column",gap:16,border:"1px solid #383E48"}},
        step==="phone"&&React.createElement(React.Fragment,null,
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:17,fontWeight:700,color:C.text,marginBottom:4}},"Войти или зарегистрироваться"),
            React.createElement("div",{style:{fontSize:12,color:C.mutedDark}},"Введите номер телефона")),
          React.createElement("input",{type:"tel",placeholder:"+7 700 000 00 00",value:phone,onChange:e=>setPhone(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleSendCode(),style:inp,autoFocus:true}),
          error&&React.createElement("div",{style:{fontSize:12,color:C.rust}},error),
          React.createElement(Btn,{onClick:handleSendCode},"Получить код")),
        step==="code"&&React.createElement(React.Fragment,null,
          React.createElement("div",{style:{fontSize:16,fontWeight:700,color:C.text}},"Код отправлен на "+savedPhone),
          React.createElement("div",{style:{fontSize:12,color:C.mutedDark}},"Проверьте консоль бэкенда"),
          React.createElement("input",{type:"text",placeholder:"000000",value:code,onChange:e=>setCode(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleVerify(),style:{...inp,fontSize:24,letterSpacing:".2em",textAlign:"center"},autoFocus:true}),
          error&&React.createElement("div",{style:{fontSize:12,color:C.rust}},error),
          React.createElement(Btn,{onClick:handleVerify},"Подтвердить"),
          React.createElement(Btn,{secondary:true,onClick:handleSendCode,disabled:countdown>0},countdown>0?"Повторить через "+countdown+" сек":"Отправить снова")),
        step==="register"&&React.createElement(React.Fragment,null,
          React.createElement("div",{style:{fontSize:17,fontWeight:700,color:C.text}},"Создать аккаунт"),
          React.createElement("div",{style:{display:"flex",gap:8}},
            [{id:"shipper",label:"Грузовладелец"},{id:"carrier",label:"Перевозчик"}].map(r=>React.createElement("button",{key:r.id,onClick:()=>setRole(r.id),style:{flex:1,padding:"11px 8px",borderRadius:8,border:"2px solid "+(role===r.id?C.amber:"#383E48"),background:role===r.id?"rgba(255,197,61,0.14)":"#2A2F38",color:role===r.id?C.amber:C.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}},r.label))),
          React.createElement("input",{placeholder:"Ваше имя",value:name,onChange:e=>setName(e.target.value),style:inp}),
          React.createElement("input",{placeholder:"Компания (необязательно)",value:company,onChange:e=>setCompany(e.target.value),style:inp}),
          error&&React.createElement("div",{style:{fontSize:12,color:C.rust}},error),
          React.createElement(Btn,{onClick:handleRegister},"Войти на биржу")))));
}
