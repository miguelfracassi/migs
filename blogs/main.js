const pn=location.pathname.replace(/\/$/,'');const P=pn.startsWith('/blog')?'blog':(pn.split('/').pop().replace('.html','')||'index');
const L=[['/index.html','Início','🏠'],['/about.html','Sobre','👋'],['/projects.html','Projetos','🚀'],['/blog/','Blog','📝'],['/links.html','Links','🔗'],['/contact.html','Contato','💬']];
const S=[['https://instagram.com/migfracassi','IG'],['https://wa.me/5519999894031','WA'],['mailto:mihnwg@gmail.com','@'],['https://ticord.website','T']];
document.body.insertAdjacentHTML('afterbegin',`<div class="pg"></div><a class="top" href="/"><img src="/logo.svg" alt="" width="36" height="36"><b>Miguel</b></a><button class="mb" aria-label="Abrir menu" aria-expanded="false"><i></i><i></i></button><div class="ov"><nav>${L.map((l,i)=>`<a href="${l[0]}" style="--i:${i}" class="${P==l[0].replace(/^\//,'').replace('.html','').replace(/\/$/,'')?'cur':''}"><span>${l[2]}</span>${l[1]}</a>`).join('')}</nav><div class="so">${S.map(x=>`<a href="${x[0]}" target="_blank" rel="noopener">${x[1]}</a>`).join('')}</div></div><div class="cur-d"></div>`);
document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap"><img src="/logo.svg" alt="" width="64" height="64"><div class="big">Vamos criar<br>algo incrível.</div><div class="row"><a href="/links.html">Todos os links</a><a href="/blog/">Blog</a><a href="https://instagram.com/migfracassi" target="_blank" rel="noopener">Instagram</a><a href="https://wa.me/5519999894031" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:mihnwg@gmail.com">E-mail</a><a href="https://ticord.website" target="_blank" rel="noopener">Ticord</a></div><p style="margin-top:36px;opacity:.6">© 2026 Miguel Fracassi. Feito com carinho e muito café.</p></div></footer>`);
const mb=document.querySelector('.mb'),tg=o=>{const v=document.body.classList.toggle('mo',o);mb.setAttribute('aria-expanded',v)};
mb.onclick=()=>tg();document.querySelectorAll('.ov a').forEach(a=>a.addEventListener('click',()=>tg(false)));addEventListener('keydown',e=>e.key=='Escape'&&tg(false));
const pg=document.querySelector('.pg');addEventListener('scroll',()=>pg.style.width=scrollY/(document.documentElement.scrollHeight-innerHeight)*100+'%');
document.querySelectorAll('[data-self]').forEach(b=>b.dataset.copy=location.href);
/* calm smooth scroll */
if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){let t=scrollY,c=scrollY,last=c;
addEventListener('wheel',e=>{if(e.ctrlKey||document.body.classList.contains('mo')||document.body.classList.contains('lock')||(e.target.closest&&e.target.closest('textarea,[data-native-scroll]')))return;e.preventDefault();t=Math.max(0,Math.min(t+e.deltaY*.7,document.documentElement.scrollHeight-innerHeight))},{passive:false});
addEventListener('scroll',()=>{if(Math.abs(scrollY-last)>2){t=c=last=scrollY}});
(function f(){c+=(t-c)*.075;if(Math.abs(t-c)>.3){scrollTo(0,c);last=scrollY}requestAnimationFrame(f)})()}
/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&(e.target.classList.add('in'),io.unobserve(e.target))),{threshold:.15});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
/* cursor + parallax */
const cd=document.querySelector('.cur-d');addEventListener('mousedown',()=>cd.classList.add('dn'));addEventListener('mouseup',()=>cd.classList.remove('dn'));document.addEventListener('mouseleave',()=>cd.classList.remove('on'));
addEventListener('mousemove',e=>{cd.classList.add('on');cd.style.left=e.clientX+'px';cd.style.top=e.clientY+'px';
document.querySelectorAll('.fl').forEach(f=>{const s=+f.dataset.s||20;f.style.transform=`translate(${(e.clientX/innerWidth-.5)*s}px,${(e.clientY/innerHeight-.5)*s}px)`})});
document.addEventListener('mouseover',e=>cd.classList.toggle('h',!!(e.target.closest&&e.target.closest('a,button,label,select,textarea,.flip,.chip,input,summary,.card,.ct,.rcpt'))));
/* tilt */
document.querySelectorAll('.tilt').forEach(c=>{c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateY(-6px)`};c.onmouseleave=()=>c.style.transform=''});
/* flip cards */
document.querySelectorAll('.flip').forEach(f=>f.onclick=()=>f.classList.toggle('on'));
/* typed roles */
const ty=document.getElementById('ty');if(ty){const R=['Influenciador','Desenvolvedor Programador','Grupo Ticord'];let i=0,j=0,d=0;(function s(){const w=R[i];j+=d?-1:1;ty.textContent=w.slice(0,j);let n=d?35:80;if(!d&&j==w.length){d=1;n=1400}else if(d&&!j){d=0;i=(i+1)%R.length;n=300}setTimeout(s,n)})()}
/* keycaps */
document.querySelectorAll('.key').forEach(k=>k.onclick=()=>{k.classList.add('p');setTimeout(()=>k.classList.remove('p'),150);
for(let n=0;n<14;n++){const d=document.createElement('i');const a=Math.random()*6.28,r=60+Math.random()*90;const b=k.getBoundingClientRect();
d.style.cssText=`position:fixed;left:${b.left+38}px;top:${b.top+38}px;width:10px;height:10px;border-radius:50%;background:${['#ffa51f','#45e0c1','#ec3b2f','#2f5bff'][n%4]};z-index:90;pointer-events:none;transition:all .8s ease-out`;
document.body.append(d);requestAnimationFrame(()=>{d.style.transform=`translate(${Math.cos(a)*r}px,${Math.sin(a)*r}px) scale(0)`;d.style.opacity=0});setTimeout(()=>d.remove(),900)}});
/* terminal */
const tf=document.getElementById('tf');if(tf){const o=document.getElementById('to'),C={ajuda:'Tente: sobre, projetos, links, contato, ticord, oi, limpar',ticord:'Abrindo ticord.website...',links:'Abrindo links...',oi:'Oi! Eu sou o Miguel. Valeu por passar aqui.',sobre:'Abrindo a página sobre...',projetos:'Abrindo os projetos...',contato:'Abrindo o contato...'},U={sobre:'about.html',projetos:'projects.html',contato:'contact.html',links:'links.html',ticord:'https://ticord.website'};
tf.onsubmit=e=>{e.preventDefault();const v=tf.q.value.trim().toLowerCase();tf.q.value='';if(v=='limpar'){o.textContent='';return}
o.textContent+=`> ${v}\n${C[v]||'Comando não encontrado. Digite ajuda.'}\n`;o.scrollTop=1e5;if(U[v])setTimeout(()=>location.href=U[v],700)}}
/* dial */
const dl=document.getElementById('dial');if(dl)dl.onclick=()=>document.getElementById('mon').classList.toggle('r');
/* copy */
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.copy);const em=b.querySelector('em');em.textContent='Copiado!';setTimeout(()=>em.textContent='Copiar',1500)});
