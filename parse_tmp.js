
const XLSX=require('xlsx');
const fs=require('fs');
const path=require('path');
const file=path.resolve(__dirname,'..','docs','samples','attendance-sample-v2.xlsx');
const buffer=fs.readFileSync(file);
const workbook=XLSX.read(buffer,{type:'buffer'});
const worksheet=workbook.Sheets[workbook.SheetNames[0]];
const rows=XLSX.utils.sheet_to_json(worksheet,{header:1,defval:'',blankrows:false});
const normalizeName=(value='')=>value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
const excelDateToJsDate=(value)=>{if(value==null||value==='')return null;if(value instanceof Date)return new Date(value.getTime());if(typeof value==='number'){const parsed=XLSX.SSF.parse_date_code(value);if(!parsed)return null;return new Date(parsed.y,parsed.m-1,parsed.d,parsed.H,parsed.M,parsed.S);}const asString=String(value).trim();if(!asString)return null;const timestamp=Date.parse(asString);if(!Number.isNaN(timestamp))return new Date(timestamp);return null;};
const buildDateTimeFromParts=(dateValue,timeValue)=>{const datePart=excelDateToJsDate(dateValue);if(!datePart)return null;if(timeValue==null||timeValue==='')return datePart;if(timeValue instanceof Date){datePart.setHours(timeValue.getHours(),timeValue.getMinutes(),timeValue.getSeconds(),0);return datePart;}if(typeof timeValue==='number'){const parsed=XLSX.SSF.parse_date_code(timeValue);if(!parsed)return datePart;datePart.setHours(parsed.H,parsed.M,parsed.S||0,0);return datePart;}const timeString=String(timeValue).trim();if(!timeString)return datePart;const [hours,minutes,seconds]=timeString.split(':').map(chunk=>parseInt(chunk,10));if(!Number.isNaN(hours)){datePart.setHours(hours,Number.isNaN(minutes)?0:minutes,Number.isNaN(seconds)?0:seconds,0);return datePart;}return datePart;};
const rowsData=rows.slice(1);
const normalizedHeaders=rows[0].map((header,idx)=>{const value=String(header||'').trim();return value?value.toLowerCase().replace(/\s+/g,'_'):`col_${idx}`;});
const getValue=(row,needles)=>{for(let i=0;i<normalizedHeaders.length;i++){const key=normalizedHeaders[i];const cell=row[i];for(const needle of needles){if(key.includes(needle))return cell;}}return undefined;};
const logs=[];
rowsData.forEach((row,index)=>{
  if(!Array.isArray(row))return;
  const nameValue=getValue(row,['employee','empleado','colaborador','nombre','name']);
  const idValue=getValue(row,['employee_id','id','codigo','identificacion']);
  const timestampValue=getValue(row,['timestamp','marca','datetime','fecha_hora']);
  const dateValue=getValue(row,['date','fecha','dia','day']);
  const timeValue=getValue(row,['time','hora','hour']);
  const remarksValue=getValue(row,['remarks','observaciones','nota']);
  const typeValue=getValue(row,['type','tipo','log','estado','marcatipo','tipo_marca']);
  let timestamp=null;
  if(timestampValue){timestamp=excelDateToJsDate(timestampValue);} else if(dateValue){timestamp=buildDateTimeFromParts(dateValue,timeValue);}
  if(!timestamp||Number.isNaN(timestamp.getTime())) return;
  logs.push({name:nameValue,timestamp:timestamp.toISOString(),type:typeValue});
});
console.log('rows',rows.length,'logs',logs.length);
console.log(logs.slice(0,4));
