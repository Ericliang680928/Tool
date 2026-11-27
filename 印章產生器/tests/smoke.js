/* 印章產生器 冒煙測試（亂填測試）
 * 用法：用瀏覽器開啟 index.html → 按 F12 → 切到「Console／主控台」→ 把這整個檔案貼上，按 Enter。
 * 做什麼：隨機操作畫面上所有欄位、滑桿、選項共 ROUNDS 輪，檢查：
 *   ① 有沒有程式錯誤  ② 畫布有沒有畫出東西  ③ 每次重畫花多久  ④ 透明底 PNG 是否正常（四個角落透明）
 * 結果會印在主控台，最後一行寫 PASS 或 FAIL。
 * 注意：測試會隨機改動畫面上的設定；跑完會把你原本儲存的設定放回去，請按 F5 重新整理頁面就會看到原本的內容。
 */
(async function(){
  const ROUNDS=150, errors=[];
  let backup=null;try{backup=localStorage.getItem('sealgen.v2');}catch(e){}
  const onErr=e=>errors.push(String(e.message||e.reason||e));
  window.addEventListener('error',onErr);window.addEventListener('unhandledrejection',onErr);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const cv=document.getElementById('cv');
  const rnd=n=>Math.floor(Math.random()*n);
  const words=['','a','王','王大明','歐陽小明','範例股份有限公司','這是一段非常非常非常長的測試文字用來檢查會不會破版','😀👍','12345678','TEL: 02-1234-5678','A\nB\nC'];
  const fire=(el,type)=>el.dispatchEvent(new Event(type,{bubbles:true}));
  const stats={rounds:0,maxMs:0,blank:0};
  const controls=()=>[...document.querySelectorAll('[data-k]')];
  async function inkCount(){
    const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;
    for(let i=3;i<d.length;i+=16)if(d[i])n++;return n;
  }
  for(let r=0;r<ROUNDS;r++){
    const list=controls();
    const el=list[rnd(list.length)];
    if(el.type==='checkbox'){el.checked=!el.checked;fire(el,'change');}
    else if(el.type==='radio'){el.checked=true;fire(el,'change');}
    else if(el.type==='range'){
      const pick=[el.min,el.max,String((+el.min+ +el.max)>>1)][rnd(3)];
      el.value=pick;fire(el,'input');
    }else{el.value=words[rnd(words.length)];fire(el,'input');}
    const t=performance.now();
    await wait(0);await wait(0);
    stats.maxMs=Math.max(stats.maxMs,Math.round(performance.now()-t));
    stats.rounds++;
  }
  // 每種形狀都確認有畫出東西
  const shapes={};
  for(const sh of ['tv','oval','square']){
    const radio=document.querySelector(`input[data-k=shape][value=${sh}]`);
    radio.checked=true;fire(radio,'change');await wait(30);
    shapes[sh]=await inkCount();
  }
  // 下載用的 PNG：四個角落必須是透明的
  const blob=await new Promise(res=>cv.toBlob(res,'image/png'));
  const bmp=await createImageBitmap(blob);
  const c2=document.createElement('canvas');c2.width=bmp.width;c2.height=bmp.height;
  const x2=c2.getContext('2d');x2.drawImage(bmp,0,0);
  const corners=[[0,0],[bmp.width-1,0],[0,bmp.height-1],[bmp.width-1,bmp.height-1]].map(([x,y])=>x2.getImageData(x,y,1,1).data[3]);
  window.removeEventListener('error',onErr);window.removeEventListener('unhandledrejection',onErr);
  const blankShape=Object.entries(shapes).filter(([,n])=>n===0).map(([k])=>k);
  const result={rounds:stats.rounds,errors,每種形狀的墨點數:shapes,PNG位元組:blob.size,PNG四角透明度:corners,最慢一輪毫秒:stats.maxMs};
  try{if(backup===null)localStorage.removeItem('sealgen.v2');else localStorage.setItem('sealgen.v2',backup);}catch(e){}
  console.log(result);
  const ok=!errors.length&&!blankShape.length&&corners.every(a=>a===0)&&blob.size>1000;
  console.log(ok?'PASS ✅ 全部正常（請按 F5 還原畫面）':'FAIL ❌ 請看上面的 errors／墨點數／透明度');
  return ok;
})();
