;(function() {

// ═══════════════════════════════════════════════════════════════
// GUARD GLOBALE — gira solo su mobile (classe ffm nel body)
// ═══════════════════════════════════════════════════════════════

if (!document.body.classList.contains('ffm')) return;

var HXH_DOMAINS = [
    'graficaxskinxelaborazione.forumfree.it',
    'hxhforumgdr.forumcommunity.net'
];
if (HXH_DOMAINS.indexOf(location.hostname) === -1) return;


// ═══════════════════════════════════════════════════════════════
// FRAMEWORK
// ═══════════════════════════════════════════════════════════════

window.HxHFramework = {
    constants:  {},
    groups:     {},
    location:   {},
    requests:   {},
    api:        {},
    utilities:  { dates: {}, string: {}, storage: {} }
};

window.HxHFramework.constants.DOMAINS    = HXH_DOMAINS;
window.HxHFramework.constants.DOMAIN     = location.hostname;
window.HxHFramework.constants.FORUM_NAME = 'Hunter x Hunter Forum - GDR Remastered';
window.HxHFramework.constants.SECTIONS   = { SPAM: null, RICAMBIO_SPAM: null, REGOLAMENTI: null };
window.HxHFramework.constants.JSONBIN_MASTER_KEY = '$2a$10$Oz7UWaTI1ugJ6ukQdWtpjOvBLnAAEFRIOvi0iyDPb.FH3Zut..lp6';
window.HxHFramework.constants.JSONBIN_ACCESS_KEY = null;

// --- GROUPS ---
function isAdmin()            { return /\badmin\b/g.test(document.body.className); }
function isGDRMaster()        { return /(g1)\b/g.test(document.body.className); }
function isGDRMod()           { return /(g2)\b/g.test(document.body.className); }
function isGDRGrapherMaster() { return /(g3)\b/g.test(document.body.className); }
function isGrapher()          { return /(g4)\b/g.test(document.body.className); }
function isUtility()          { return /(g14)\b/g.test(document.body.className); }
function isStaff()            { return /\badmin\b/g.test(document.body.className) || /(g1|g2|g3|g4)\b/g.test(document.body.className); }
function isUser()             { return /(g1|g2|g3|g4|g5|g6|g7|g8|g9|g10|g11|g12|g13|g14)\b/g.test(document.body.className); }
function isGuest()            { return !isUser(); }
window.HxHFramework.groups = { isAdmin: isAdmin, isGDRMaster: isGDRMaster, isGDRMod: isGDRMod, isGDRGrapherMaster: isGDRGrapherMaster, isGrapher: isGrapher, isUtility: isUtility, isStaff: isStaff, isUser: isUser, isGuest: isGuest };

// --- LOCATION ---
function isHome()       { return document.body.id === 'board'; }
function isTopic()      { return document.body.id === 'topic'; }
function isSection()    { return document.body.id === 'forum'; }
function getTopicId()   { var m = location.search.match(/[?&]t=(\d+)/); return m ? m[1] : null; }
function getSectionId() { var m = location.search.match(/[?&]f=(\d+)/); return m ? m[1] : null; }
window.HxHFramework.location = { isHome: isHome, isTopic: isTopic, isSection: isSection, getTopicId: getTopicId, getSectionId: getSectionId };

// --- REQUESTS ---
function fetchToken(callback) {
    fetch('https://' + location.hostname + '/')
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var marker = 'name=' + '"s" value="';
            var start  = html.indexOf(marker);
            var token  = null;
            if (start !== -1) { start += marker.length; var end = html.indexOf('"', start); if (end !== -1) token = html.substring(start, end); }
            callback(token);
        })
        .catch(function() { callback(null); });
}
function fetchData(method, url, body, callback) {
    fetch(url, { method: method, body: body })
        .then(function(res) {
            var ct = res.headers.get('content-type') || '';
            var hm = ct.match(/charset=([^;\s]+)/i);
            var charset = hm ? hm[1].trim().toLowerCase() : null;
            return res.arrayBuffer().then(function(buffer) {
                if (!charset) { try { var g = new TextDecoder('utf-8').decode(buffer); var mm = g.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i); if (mm) charset = mm[1].toLowerCase(); } catch(e) {} }
                charset = charset || 'utf-8';
                var decoded;
                try { decoded = new TextDecoder(charset).decode(buffer); } catch(e) { try { decoded = new TextDecoder('utf-8').decode(buffer); } catch(e2) { decoded = new TextDecoder('windows-1252').decode(buffer); } }
                callback(new DOMParser().parseFromString(decoded, 'text/html'));
            });
        })
        .catch(function(e) { console.error('[HxHFramework] fetchData error:', e); });
}
function postComment(token, sectionId, topicId, content, callback, enablesig, track_topic) {
    enablesig   = enablesig   !== undefined ? enablesig   : '1';
    track_topic = track_topic !== undefined ? track_topic : '1';
    var fd = new FormData();
    fd.set('st','0'); fd.set('act','Post'); fd.set('s',token); fd.set('CODE','03');
    fd.set('f',sectionId); fd.set('t',topicId); fd.set('Post',content);
    fd.set('enablesig',enablesig); fd.set('track_topic',track_topic);
    fd.set('mod_options','nowt'); fd.set('charset','UTF-8'); fd.set('cook'+'ie','1');
    fetchData('POST', 'https://' + location.hostname + '/', fd, function(doc) {
        callback(doc && doc.location && doc.location.href ? doc.location.href.indexOf('saved') !== -1 : true, doc);
    });
}
function postTopic(sectionId, title, content, callback) {
    fetch('https://' + location.hostname + '/?act=Post&CODE=00&f=' + sectionId)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var form = doc.getElementById('REPLIER_POST');
            if (!form) { callback(false, null); return; }
            var fd = new FormData();
            fd.set('st',form.st.value); fd.set('act',form.act.value); fd.set('s',form.s.value);
            fd.set('f',form.f.value); fd.set('CODE',form.CODE.value); fd.set('TopicTitle',title);
            fd.set('Post',content); fd.set('enablesig','1'); fd.set('track_topic','1'); fd.set('charset','UTF-8');
            if (form.MAX_FILE_SIZE) fd.set('MAX_FILE_SIZE',form.MAX_FILE_SIZE.value);
            if (form.check) fd.set('check',form.check.value);
            return fetch('https://' + location.hostname + '/', { method:'POST', body:fd }).then(function(r) { return r.text(); });
        })
        .then(function(html) {
            if (!html) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var m = doc.body.className.match(/t(\d+)/);
            callback(true, m ? m[1] : null);
        })
        .catch(function(e) { console.error('[HxHFramework] postTopic error:', e); callback(false, null); });
}
window.HxHFramework.requests = { fetchToken: fetchToken, fetchData: fetchData, postComment: postComment, postTopic: postTopic };

// --- API ---
async function getUserTopicsInSection(userId, sectionId, includePinned) {
    userId = userId || Commons.user.id; sectionId = sectionId || Commons.location.section.id; includePinned = includePinned || false;
    try { var res = await fetch('https://' + location.hostname + '/api.php?starter=' + userId + '&f=' + sectionId + (includePinned ? '' : '&no_pinned=1&no_annunci=1') + '&cookie=1'); var data = await res.json(); return data.topic_ids || []; }
    catch(e) { return []; }
}
async function hasUserTopicsInSection(userId, sectionId) { return (await getUserTopicsInSection(userId, sectionId)).length > 0; }
async function getAllTopicsInSection(sectionId) {
    if (!sectionId) return [];
    var all = [], page = 0, hasMore = true;
    try {
        while (hasMore && page < 50) {
            var res = await fetch('https://' + location.hostname + '/api.php?f=' + sectionId + '&st=' + (page*15) + '&cookie=1');
            if (!res.ok) break;
            var data = await res.json();
            if (data && data.threads && data.threads.length > 0) {
                data.threads.forEach(function(t) { all.push({ title:t.title, url:'https://'+location.hostname+'/?t='+t.id, id:t.id }); });
                if (data.threads.length < 15) hasMore = false; else page++;
            } else { hasMore = false; }
        }
    } catch(e) {}
    return all;
}
window.HxHFramework.api = { getUserTopicsInSection: getUserTopicsInSection, hasUserTopicsInSection: hasUserTopicsInSection, getAllTopicsInSection: getAllTopicsInSection };

// --- UTILITIES > DATES ---
function formatDate(date, template) {
    date = date || new Date(); template = template || 'D/M/Y';
    var pad = function(n) { return n < 10 ? '0'+n : ''+n; };
    return template.replace('D',pad(date.getDate())).replace('M',pad(date.getMonth()+1)).replace('Y',date.getFullYear())
                   .replace('H',pad(date.getHours())).replace('I',pad(date.getMinutes())).replace('S',pad(date.getSeconds()));
}
function isSameDay(day) { var t=new Date(),c=new Date(day); return t.getDate()===c.getDate()&&t.getMonth()===c.getMonth()&&t.getFullYear()===c.getFullYear(); }
function isNewDay(key) { var today=formatDate(new Date(),'D/M/Y'),last=localStorage.getItem(key); if(last!==today){localStorage.setItem(key,today);return true;} return false; }
window.HxHFramework.utilities.dates = { formatDate: formatDate, isSameDay: isSameDay, isNewDay: isNewDay };

// --- UTILITIES > STRING ---
function getURLParameter(url, parameter) { var m=new RegExp('[?&]'+parameter+'=([^&#]*)').exec(url); return m?decodeURIComponent(m[1]):null; }
function JSONtoString(json)   { try{return JSON.stringify(json);}catch(e){return '';} }
function StringToJSON(string) { try{return JSON.parse(string);}catch(e){return null;} }
window.HxHFramework.utilities.string = { getURLParameter: getURLParameter, JSONtoString: JSONtoString, StringToJSON: StringToJSON };

// --- UTILITIES > STORAGE ---
function storageSet(key,value) { try{localStorage.setItem(key,typeof value==='object'?JSONtoString(value):value);}catch(e){} }
function storageGet(key,parseJSON) { var v=localStorage.getItem(key); if(v===null)return null; return parseJSON?StringToJSON(v):v; }
function storageRemove(key) { localStorage.removeItem(key); }
function storageExists(key) { return localStorage.getItem(key)!==null; }
window.HxHFramework.utilities.storage = { set: storageSet, get: storageGet, remove: storageRemove, exists: storageExists };

// --- UTILITIES > MISC ---
function waitFor(condition, callback, interval, timeout) {
    interval=interval||100; timeout=timeout||10000; var elapsed=0;
    function check() { if(condition()){callback();}else if(elapsed>=timeout){console.warn('[HxHFramework] waitFor timeout.');}else{elapsed+=interval;setTimeout(check,interval);} }
    check();
}
window.HxHFramework.utilities.waitFor = waitFor;

console.log('[HxHFramework] mobile — Loaded on ' + location.hostname);


// ═══════════════════════════════════════════════════════════════
// FILTERGRID
// ═══════════════════════════════════════════════════════════════

window.filterGridConfig = {
    pillCss: ['font-size:10px','font-weight:700','letter-spacing:.5px','padding:3px 11px','border-radius:20px','cursor:pointer','border:1.5px solid','transition:background .15s,color .15s,border-color .15s'].join(';'),
    activeBackground: '#0B486B', activeColor: '#CFF09E', activeBorder: '#0B486B',
    inactiveBackground: 'transparent', inactiveColor: '#3B8686', inactiveBorder: '#3B8686',
    controlsCss: 'display:flex;gap:5px;flex-wrap:wrap;'
};

function filterGrid(opts) {
    var cfg = window.filterGridConfig || {};
    var o = Object.assign({ itemSelector:'[data-group]', gridSelector:'#filter-grid', controlsSelector:'#filter-controls', allLabel:'Tutti', groupLabels:{}, hiddenClass:'fg-hidden', activeClass:'fg-active' }, opts || {});
    var controls = document.querySelector(o.controlsSelector);
    var items    = document.querySelectorAll(o.itemSelector);
    if (!controls || !items.length) return;
    var seen = {}, groups = [];
    items.forEach(function(el) { var g=el.getAttribute('data-group'); if(g&&!seen[g]){seen[g]=true;groups.push(g);} });
    function setActive(btn)   { btn.style.background=cfg.activeBackground||'#000'; btn.style.color=cfg.activeColor||'#fff'; btn.style.borderColor=cfg.activeBorder||'#000'; }
    function setInactive(btn) { btn.style.background=cfg.inactiveBackground||'transparent'; btn.style.color=cfg.inactiveColor||'#000'; btn.style.borderColor=cfg.inactiveBorder||'#000'; }
    function makePill(f,label,active) { var btn=document.createElement('button'); btn.textContent=label; btn.dataset.f=f; btn.style.cssText=cfg.pillCss||''; if(active){btn.classList.add(o.activeClass);setActive(btn);}else{setInactive(btn);} return btn; }
    if (cfg.controlsCss) controls.style.cssText = cfg.controlsCss;
    var pills = [makePill('__all__', o.allLabel, true)];
    groups.forEach(function(g) { pills.push(makePill(g, o.groupLabels[g]||g, false)); });
    pills.forEach(function(p) { controls.appendChild(p); });
    var hs = document.createElement('style');
    hs.textContent = o.controlsSelector+' button:hover{background:'+(cfg.activeBackground||'#000')+' !important;color:'+(cfg.activeColor||'#fff')+' !important;border-color:'+(cfg.activeBorder||'#000')+' !important}\n.'+o.hiddenClass+'{display:none !important}';
    document.head.appendChild(hs);
    controls.addEventListener('click', function(e) {
        var btn=e.target.closest('button'); if(!btn||!btn.dataset.f) return;
        pills.forEach(function(p){p.classList.remove(o.activeClass);setInactive(p);}); btn.classList.add(o.activeClass); setActive(btn);
        var f=btn.dataset.f; items.forEach(function(el){el.classList.toggle(o.hiddenClass,f!=='__all__'&&el.getAttribute('data-group')!==f);});
    });
}
(function waitFG() { if(document.querySelector('#filter-controls')&&document.querySelector('[data-group]')){filterGrid();}else{setTimeout(waitFG,50);} })();


// ═══════════════════════════════════════════════════════════════
// ECHO SLIDER
// ═══════════════════════════════════════════════════════════════

;(function() {
    var F  = window.HxHFramework;
    var ST = F.utilities.storage;

    // ── CONFIG ──
    var config = {
        forumId:         '1082772',
        sezioniEscluse:  [65111597, 65111833],
        numTopics:       10,
        intervalloSlide: 5000,
        maxExpanded:     10,
        posizionamento:  '.tagboard',
        coloriSezioni: {
            'Ongame':  { ids: ['65114233','65114232','65114231','65114236'], color: 'var(--tre)' },
            'Offgame': { ids: ['65114124','65112407','65112409'],            color: 'var(--quattro)' },
            'Extra':   { ids: ['65073571','65073572'],                       color: 'var(--cinque)' }
        }
    };

    var echoTopicsData=[], echoCurrentIndex=0, echoSliderInterval=null, echoSliderElement=null;

    function echoLoadTopics(callback) {
        var sp = config.sezioniEscluse.length ? '&nosez='+config.sezioniEscluse.join(',') : '';
        fetch('https://'+location.hostname+'/api.php?a=1&n='+config.numTopics+sp+'&cook'+'ie=1&_='+Date.now())
            .then(function(r){if(!r.ok)throw new Error();return r.text();})
            .then(function(text){
                var data;
                try{data=JSON.parse(text.replace(/[\n\r\t]/g,' ').trim());}
                catch(e){try{data=JSON.parse(text.replace(/,\s*]/g,']').replace(/,\s*}/g,'}').replace(/[\n\r\t]/g,' ').trim());}catch(e2){throw new Error();}}
                if(!data.threads||!data.threads.length){if(callback)callback(false);return;}
                echoTopicsData=[];
                for(var i=0;i<data.threads.length;i++){
                    var th=data.threads[i],lp=th.info.last;
                    echoTopicsData.push({id:th.id,title:th.title,url:'https://'+location.hostname+'/?t='+th.id+'&view=getlastpost#lastpost',author:lp.name,authorId:lp.id,authorUrl:'https://'+location.hostname+'/?act=Profile&MID='+lp.id,avatar:lp.avatar,date:F.utilities.dates.formatDate(new Date(lp.date),'D/M/Y'),time:F.utilities.dates.formatDate(new Date(lp.date),'H:I'),sectionName:th.section_name||'N/A',sectionId:th.section_id||''});
                }
                var ds={}; for(var j=0;j<echoTopicsData.length;j++){ds['t'+echoTopicsData[j].id]=echoTopicsData[j];} ST.set('EchoSliderData',ds);
                if(callback)callback(true);
            })
            .catch(function(){
                var cached=ST.get('EchoSliderData',true);
                if(cached){echoTopicsData=[];for(var k in cached){if(cached.hasOwnProperty(k))echoTopicsData.push(cached[k]);}if(callback)callback(true);}
                else{if(callback)callback(false);}
            });
    }

    function echoDecodeHtml(str){var t=document.createElement('div');t.innerHTML=str;return t.innerHTML;}

    function echoCreateSlider(){
        var target=document.querySelector(config.posizionamento); if(!target)return false;
        var d=document.createElement('div'); d.id='echo-slider';
        d.innerHTML='<div class="echo-wrapper"><div class="echo-container"><div class="echo-loading">Caricamento...</div></div></div><div class="echo-nav"><button class="echo-btn echo-prev"><i class="fa fa-chevron-left"></i></button><button class="echo-btn echo-next"><i class="fa fa-chevron-right"></i></button><button class="echo-btn echo-expand"><i class="fa fa-chevron-down"></i></button></div>';
        target.parentNode.insertBefore(d,target); echoSliderElement=d;
        d.querySelector('.echo-prev').addEventListener('click',function(e){e.preventDefault();echoPrevSlide();});
        d.querySelector('.echo-next').addEventListener('click',function(e){e.preventDefault();echoNextSlide();});
        d.querySelector('.echo-expand').addEventListener('click',function(e){e.preventDefault();echoToggleExpand();});
        return true;
    }

    function echoBuildAllSlides(){
        if(!echoSliderElement)return;
        var container=echoSliderElement.querySelector('.echo-container'),html='';
        for(var i=0;i<config.numTopics;i++){
            if(i<echoTopicsData.length){
                var t=echoTopicsData[i],av=t.avatar?'<img src="'+t.avatar+'" class="echo-avatar" alt="'+t.author+'">':'<div class="echo-avatar echo-avatar-default"></div>';
                var su=t.sectionId?'https://'+location.hostname+'/?f='+t.sectionId:'#',ss='';
                if(t.sectionId){var sid=String(t.sectionId);outer:for(var g in config.coloriSezioni){if(!config.coloriSezioni.hasOwnProperty(g))continue;var grp=config.coloriSezioni[g];for(var j=0;j<grp.ids.length;j++){if(grp.ids[j]===sid){ss=' style="background:'+grp.color+' !important"';break outer;}}}}
                html+='<div class="echo-item"><a href="'+su+'" class="echo-section"'+ss+' target="_blank">'+echoDecodeHtml(t.sectionName)+'</a><a href="'+t.authorUrl+'" class="echo-avatar-wrap" target="_blank">'+av+'</a><div class="echo-content"><div class="echo-meta"><a href="'+t.authorUrl+'" class="echo-author" target="_blank">'+t.author+'</a><span class="echo-action">dice:</span><a href="'+t.url+'" class="echo-topic" target="_blank">'+t.title+'</a></div><div class="echo-time">alle <span class="echo-hour">'+t.time+'</span> del <span class="echo-date">'+t.date+'</span></div></div></div>';
            } else {
                html+='<div class="echo-item echo-placeholder"><div class="echo-section" style="background:#000!important">N/A</div><div class="echo-avatar-wrap"><img src="https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png" class="echo-avatar"></div><div class="echo-content"><div class="echo-meta"><span class="echo-author" style="color:#ebeadd">Nessun topic</span><span class="echo-action" style="color:#6d5b7a">disponibile</span></div></div></div>';
            }
        }
        container.innerHTML=html;
    }

    function echoShowTopic(i){if(echoSliderElement)echoSliderElement.querySelector('.echo-container').style.transform='translateX('+-(i*echoSliderElement.offsetWidth)+'px)';}
    function echoPrevSlide(){echoCurrentIndex=(echoCurrentIndex-1+config.numTopics)%config.numTopics;echoShowTopic(echoCurrentIndex);echoResetAutoplay();}
    function echoNextSlide(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);echoResetAutoplay();}
    function echoResetAutoplay(){if(echoSliderInterval)clearInterval(echoSliderInterval);echoSliderInterval=setInterval(function(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);},config.intervalloSlide);}

    function echoToggleExpand(){
        if(!echoSliderElement)return;
        var w=echoSliderElement.querySelector('.echo-wrapper'),c=echoSliderElement.querySelector('.echo-container');
        var eb=echoSliderElement.querySelector('.echo-expand'),pb=echoSliderElement.querySelector('.echo-prev'),nb=echoSliderElement.querySelector('.echo-next');
        var icon=eb.querySelector('i'),exp=echoSliderElement.classList.contains('echo-expanded'),items=c.querySelectorAll('.echo-item');
        if(exp){
            for(var i=0;i<items.length;i++)items[i].style.display='flex';
            echoSliderElement.classList.remove('echo-expanded');w.style.overflow='hidden';c.style.transition='transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)';
            icon.className='fa fa-chevron-down';pb.style.display='flex';nb.style.display='flex';echoResetAutoplay();
        } else {
            for(var i=0;i<items.length;i++)items[i].style.display=i<config.maxExpanded?'flex':'none';
            c.style.transition='none';c.style.transform='translateX(0)';echoSliderElement.classList.add('echo-expanded');w.style.overflow='visible';
            icon.className='fa fa-chevron-up';pb.style.display='none';nb.style.display='none';if(echoSliderInterval)clearInterval(echoSliderInterval);
        }
    }

    function echoStartSlider(){if(echoSliderInterval)clearInterval(echoSliderInterval);echoBuildAllSlides();echoCurrentIndex=0;echoShowTopic(0);echoSliderInterval=setInterval(function(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);},config.intervalloSlide);}

    function echoInitSlider(){
        var init=function(){if(!echoCreateSlider())return;echoLoadTopics(function(){echoStartSlider();});};
        if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{setTimeout(init,100);}
    }
    echoInitSlider();
})();


// ═══════════════════════════════════════════════════════════════
// SKIN ALTERNATIVE
// ═══════════════════════════════════════════════════════════════

;(function() {
    // ── CONFIG ──
    // 0 = solo base | 1 = Base+Halloween | 2 = Base+Natale | 3 = DEBUG (tutti)
    var skinAttive = 3;

    function def()       { document.body.classList.remove('bodynatale','bodyhalloween'); document.body.classList.add('bodydef'); }
    function natale()    { document.body.classList.remove('bodydef','bodyhalloween');    document.body.classList.add('bodynatale'); }
    function halloween() { document.body.classList.remove('bodydef','bodynatale');       document.body.classList.add('bodyhalloween'); }

    var saved = localStorage.getItem('skin');
    if (!saved)                     { localStorage.setItem('skin','def'); def(); }
    else if (saved === 'def')       { def(); }
    else if (saved === 'natale')    { natale(); }
    else if (saved === 'halloween') { halloween(); }

    if (skinAttive === 0) { def(); localStorage.setItem('skin','def'); return; }

    document.addEventListener('DOMContentLoaded', function() {
        var menu = document.querySelector('.menuwrap .right');
        if (!menu) return;
        function makeBtn(cls, fn, key) { var b=document.createElement('span'); b.className='skin-switcher '+cls; b.onclick=function(){fn();localStorage.setItem('skin',key);}; return b; }
        var base = makeBtn('skin-base',      def,       'def');
        var hBtn = makeBtn('skin-halloween', halloween, 'halloween');
        var nBtn = makeBtn('skin-natale',    natale,    'natale');
        if      (skinAttive === 1) { menu.appendChild(base); menu.appendChild(hBtn); }
        else if (skinAttive === 2) { menu.appendChild(base); menu.appendChild(nBtn); }
        else if (skinAttive === 3) { menu.appendChild(base); menu.appendChild(hBtn); menu.appendChild(nBtn); }
    });
    // Inietta i bottoni skin in #ff_links
document.addEventListener('DOMContentLoaded', function() {
    var ffLinks = document.querySelector('#ff_links');
    if (!ffLinks) return;

    var box = document.createElement('div');
    box.id = 'skin-addon-box';

    if (skinAttive >= 1) {
        var b = document.createElement('span');
        b.className = 'skin-switcher skin-base';
        b.onclick = function() { def(); localStorage.setItem('skin','def'); };
        box.appendChild(b);
    }
    if (skinAttive === 1 || skinAttive === 3) {
        var h = document.createElement('span');
        h.className = 'skin-switcher skin-halloween';
        h.onclick = function() { halloween(); localStorage.setItem('skin','halloween'); };
        box.appendChild(h);
    }
    if (skinAttive === 2 || skinAttive === 3) {
        var n = document.createElement('span');
        n.className = 'skin-switcher skin-natale';
        n.onclick = function() { natale(); localStorage.setItem('skin','natale'); };
        box.appendChild(n);
    }

    ffLinks.appendChild(box);
});
})();


// ═══════════════════════════════════════════════════════════════
// TEAMZONE PATCH
// ═══════════════════════════════════════════════════════════════

;(function() {
    // ── CONFIG ──
    window.TeamZoneConfig = {
        recruit: {
            enabled: true,
            url:     'https://hxhforumgdr.forumcommunity.net/?t=61175237',
            text:    'Cerchiamo staff, proponiti <a href="{url}">QUI</a>'
        }
    };

    function patchTooltip() {
        var icon = document.querySelector('.team-zone-show-suspended-members'); if(!icon)return;
        ['data-tooltip','data-info','title','aria-label','data-title','data-content'].forEach(function(a){if(icon.getAttribute(a)==='Mostra Membri Sospesi')icon.setAttribute(a,'Staff ad Honorem');});
    }
    function addRecruitBanner() {
        var cfg = window.TeamZoneConfig && window.TeamZoneConfig.recruit; if(!cfg){setTimeout(addRecruitBanner,300);return;} if(!cfg.enabled)return;
        var list = document.querySelector('.team-zone-content.team-zone-member-list'); if(!list){setTimeout(addRecruitBanner,300);return;}
        var b=document.createElement('DIV'); b.className='team-zone-recruit-banner'; b.innerHTML=cfg.text.replace('{url}',cfg.url); list.appendChild(b);
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){patchTooltip();addRecruitBanner();});}
    else{setTimeout(function(){patchTooltip();addRecruitBanner();},500);}
})();


// ═══════════════════════════════════════════════════════════════
// COMPLEANNI
// ═══════════════════════════════════════════════════════════════

;(function() {
    var F  = window.HxHFramework;
    var ST = F.utilities.storage;

    // ── CONFIG ──
    var SETTINGS = { sez: 65073571, topic: 81025561, toast_duration: 8000 };

    window.addEventListener('load', function() {
        if (!F.location.isHome() || F.groups.isGuest()) return;
        F.requests.fetchToken(function(token) {
            var today=new Date().toDateString(), BIRTHDAYS=[];
           var container = document.querySelector('#birthdays');
if (container) {
    var links = container.querySelectorAll('.submenu a');for(var i=0;i<links.length;i++){var a=links.item(i),href=a.getAttribute('href')||'',m=href.match(/MID=(\d+)/);BIRTHDAYS.push({id:m?m[1]:null,nickname:a.textContent.trim(),url:href});}}
            if(!BIRTHDAYS.length)return;
            for(var i=0;i<BIRTHDAYS.length;i++){if(BIRTHDAYS[i].id==Commons.user.id)return;}
            injectFA(); injectStyles();
            if(ST.get('bgr-done')===today)return;
            if(ST.get('bgr-lastcheck')===today){showBubble(BIRTHDAYS);return;}
            ST.set('bgr-lastcheck',today); showCard(BIRTHDAYS);

            function postWish(birthdays,callback){
                var tags=''; for(var i=0;i<birthdays.length;i++){if(i>0)tags+=', ';tags+='<mark data-uid="'+birthdays[i].id+'">'+birthdays[i].nickname+'</mark>';}
                var msg='<div style="background:linear-gradient(135deg,#1a1040 0%,#0d3b52 100%);border-radius:16px;padding:28px;font-family:Montserrat,sans-serif;">'
                    +'<div style="text-align:center;margin-bottom:20px;"><div style="font-size:36px;color:#79BD9A;"><i class="fa fa-birthday-cake"></i></div>'
                    +'<div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#79BD9A,#CFF09E,#79BD9A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Buon Compleanno!</div></div>'
                    +'<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:16px;text-align:center;margin-bottom:18px;">'
                    +'<p style="font-size:14px;color:#8FBEBA;margin:0;">Tanti auguri a '+tags+' da parte di tutti noi di <strong style="color:#E2F7C4;">'+F.constants.FORUM_NAME+'</strong>!</p></div>'
                    +'<div style="text-align:center;border-top:1px solid rgba(143,190,186,.15);padding-top:14px;"><span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(143,190,186,.5);">'+F.constants.FORUM_NAME+'</span></div></div>';
                F.requests.postComment(token,SETTINGS.sez,SETTINGS.topic,msg,function(ok){callback(ok);});
            }
            function showCard(b){renderCard(b,true);}
            function showCardFromBubble(b){renderCard(b,false);}
            function renderCard(birthdays,autoDismiss){
                var nl=buildNamesList(birthdays),verb=birthdays.length===1?'compie gli anni oggi!':'compiono gli anni oggi!';
                document.body.insertAdjacentHTML('beforeend','<div id="bgr-card"><button class="bgr-close"><i class="fa fa-times"></i></button><div class="bgr-icon"><i class="fa fa-birthday-cake"></i></div><div class="bgr-body"><p class="bgr-title">Compleanni di oggi!</p><p class="bgr-subtitle">'+nl+' '+verb+'</p><button class="bgr-btn" id="bgr-wish-btn"><i class="fa fa-heart"></i> Fai gli auguri!</button></div></div>');
                var card=document.getElementById('bgr-card'),wb=document.getElementById('bgr-wish-btn'),cb=card.querySelector('.bgr-close');
                wb.addEventListener('click',function(){wb.disabled=true;wb.innerHTML='<i class="fa fa-spinner fa-spin"></i> Invio...';postWish(birthdays,function(){ST.set('bgr-done',today);setTimeout(function(){document['loca'+'tion']['hre'+'f']='https://'+location.hostname+'/?t='+SETTINGS.topic+'#newpost';},2000);});});
                if(autoDismiss){cb.addEventListener('click',function(){minimizeToBubble(card,birthdays);});setTimeout(function(){minimizeToBubble(card,birthdays);},SETTINGS.toast_duration);}
                else{cb.addEventListener('click',function(){if(card.parentNode)card.parentNode.removeChild(card);showBubble(birthdays);});}
            }
            function minimizeToBubble(card,birthdays){if(!card||card._minimizing)return;card._minimizing=true;card.style.animation='bgr-shrink .4s forwards';setTimeout(function(){if(card.parentNode)card.parentNode.removeChild(card);if(ST.get('bgr-done')!==today)showBubble(birthdays);},400);}
            function showBubble(birthdays){document.body.insertAdjacentHTML('beforeend','<button id="bgr-bubble"><i class="fa fa-birthday-cake"></i></button>');var b=document.getElementById('bgr-bubble');b.addEventListener('click',function(){if(b.parentNode)b.parentNode.removeChild(b);showCardFromBubble(birthdays);});}
            function buildNamesList(birthdays){var h='';for(var i=0;i<birthdays.length;i++){if(i>0)h+=', ';h+='<a class="bgr-name" href="https://'+location.hostname+birthdays[i].url+'">'+birthdays[i].nickname+'</a>';}return h;}
        });
    });

    function injectFA(){if(document.getElementById('bgr-fa'))return;var l=document.createElement('link');l.id='bgr-fa';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';document.head.appendChild(l);}
    function injectStyles(){
        if(document.getElementById('bgr-styles'))return;
        var css='@keyframes bgr-slideIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}'
            +'@keyframes bgr-shrink{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.5)}}'
            +'@keyframes bgr-bubbleIn{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}'
            +'#bgr-card{position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;align-items:flex-start;gap:14px;background:linear-gradient(135deg,#292354 0%,#0B486B 100%);border-radius:20px;box-shadow:0 16px 48px rgba(11,72,107,.5);padding:22px 24px;max-width:320px;animation:bgr-slideIn .4s cubic-bezier(.22,1,.36,1) forwards;border-top:3px solid #79BD9A;border-bottom:3px solid #79BD9A;font-family:Montserrat,inherit}'
            +'#bgr-card .bgr-close{position:absolute;top:10px;right:12px;background:none;border:none;font-size:11px;color:rgba(143,190,186,.4);cursor:pointer;padding:2px 4px}'
            +'#bgr-card .bgr-icon{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#79BD9A,#CFF09E);display:flex;align-items:center;justify-content:center;font-size:21px;color:#0B486B;flex-shrink:0}'
            +'#bgr-card .bgr-body{display:flex;flex-direction:column;gap:6px;padding-right:14px}'
            +'#bgr-card .bgr-title{margin:0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(90deg,#79BD9A,#CFF09E);-webkit-background-clip:text;-webkit-text-fill-color:transparent}'
            +'#bgr-card .bgr-subtitle{margin:0;font-size:13px;font-weight:500;color:#8FBEBA;line-height:1.55}'
            +'#bgr-card .bgr-name{font-weight:800;color:#CFF09E;text-decoration:none;-webkit-text-fill-color:#CFF09E}'
            +'#bgr-card .bgr-btn{margin-top:10px;padding:9px 20px;background:transparent;color:#CFF09E;border:1.5px solid #CFF09E;border-radius:50px;font-family:Montserrat,inherit;font-weight:700;font-size:11px;cursor:pointer;align-self:flex-start;transition:.2s}'
            +'#bgr-card .bgr-btn:hover{background:#CFF09E;color:#0B486B}'
            +'#bgr-bubble{position:fixed;bottom:24px;left:24px;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#292354,#0B486B);color:#79BD9A;border:2px solid #79BD9A;font-size:22px;cursor:pointer;animation:bgr-bubbleIn .3s cubic-bezier(.22,1,.36,1) forwards;transition:.3s ease}'
            +'#bgr-bubble:hover{transform:scale(1.1)}';
        var s=document.createElement('style');s.id='bgr-styles';s.textContent=css;document.head.appendChild(s);
    }
})();


// ═══════════════════════════════════════════════════════════════
// METEO — CONFIG
// ═══════════════════════════════════════════════════════════════

window.HXH = {
    GAME_EPOCH:        new Date("2017-01-01T01:00:00Z"),
    REAL_EPOCH:        new Date("2026-04-09T17:52:00Z"),
    MINS_PER_GAME_DAY: 2880,
    DEFAULT_LOC: { id:"65114245", name:"Swardani", offset:-1, climate:"subtropical" },
    DEBUG_WEATHER: null,
    SECTION_MAP: {
        "65073568":{ name:"Solmara",                         offset:-2, climate:"temperate"   },
        "65114247":{ name:"Regno di Kukan'yu",               offset:-2, climate:"temperate"   },
        "65114478":{ name:"Villaggio di Trakey",             offset:-2, climate:"temperate"   },
        "65114477":{ name:"Insediamento Melioras",           offset:-2, climate:"temperate"   },
        "65114251":{ name:"Zapan",                           offset:-2, climate:"temperate"   },
        "65114250":{ name:"Dolle Harbor",                    offset:-2, climate:"temperate"   },
        "65114248":{ name:"Repubblica di Lapet",             offset:-2, climate:"subtropical" },
        "65114249":{ name:"Jappon",                          offset:-2, climate:"subtropical" },
        "65114479":{ name:"Villaggio dei Fiori",             offset:-2, climate:"subtropical" },
        "65114480":{ name:"Villaggio delle Nuvole",          offset:-2, climate:"subtropical" },
        "65073569":{ name:"Yorbian",                         offset:-2, climate:"temperate"   },
        "65114252":{ name:"Stati Uniti di Saherta",          offset:-2, climate:"temperate"   },
        "65114256":{ name:"York Shin",                       offset:-2, climate:"temperate"   },
        "65114254":{ name:"Kravos",                          offset:-2, climate:"subpolar"    },
        "65073567":{ name:"Narevka",                         offset:-1, climate:"subtropical" },
        "65114239":{ name:"Repubblica di Padokia",           offset:-1, climate:"subtropical" },
        "65114240":{ name:"Monte Kukuru",                    offset:-1, climate:"subtropical" },
        "65114241":{ name:"Zerkaid",                         offset:-1, climate:"subtropical" },
        "65114244":{ name:"Parasta",                         offset:-1, climate:"subtropical" },
        "65114245":{ name:"Swardani",                        offset:-1, climate:"subtropical" },
        "65114246":{ name:"Swardani",                        offset:-1, climate:"subtropical" },
        "65114236":{ name:"Swardani",                        offset:-1, climate:"subtropical" },
        "65114242":{ name:"Repubblica di Mimbo",             offset:-1, climate:"subtropical" },
        "65114255":{ name:"Elyndar",                         offset:-1, climate:"temperate"   },
        "65114253":{ name:"Isole di Balsa",                  offset:-1, climate:"subpolar"    },
        "65114263":{ name:"Arcipelago di Luneth",            offset:-1, climate:"subpolar"    },
        "65114257":{ name:"Unione di Mitene",                offset:-1, climate:"subpolar"    },
        "65114258":{ name:"NGL",                             offset:-1, climate:"subpolar"    },
        "65114481":{ name:"Monte Hiei",                      offset:-1, climate:"subpolar"    },
        "65114482":{ name:"Monte Kurama",                    offset:-1, climate:"subpolar"    },
        "65114259":{ name:"Repubblica di Rokario",           offset:-1, climate:"subpolar"    },
        "65114260":{ name:"Repubblica di Hass",              offset:-1, climate:"subpolar"    },
        "65114261":{ name:"Rep. Gorteau Occidentale",        offset:-1, climate:"subpolar"    },
        "65114262":{ name:"Rep. Gorteau Orientale",          offset:-1, climate:"subpolar"    },
        "65114243":{ name:"Repubblica Kotoritana",           offset: 0, climate:"subtropical" },
        "65114235":{ name:"Greed Island",                    offset: 0, climate:"temperate"   },
        "65114271":{ name:"Greed Island 2",                  offset: 0, climate:"temperate"   },
        "65114234":{ name:"Citt\u00e0 delle Stelle Cadenti", offset:+1, climate:"subtropical" },
        "65114272":{ name:"Meteor",                          offset:+1, climate:"subtropical" },
        "65114233":{ name:"Vandros",                         offset:+1, climate:"subpolar"    },
        "65114270":{ name:"Unione di Beger\u00f2ss\u00e8",  offset:+1, climate:"subpolar"    },
        "65114231":{ name:"Azia",                            offset:+2, climate:"temperate"   },
        "65114265":{ name:"Torvane",                         offset:+2, climate:"subtropical" },
        "65114483":{ name:"Citt\u00e0 Eterna",               offset:+2, climate:"subtropical" },
        "65114264":{ name:"Impero di Kakin",                 offset:+2, climate:"temperate"   },
        "65114484":{ name:"Villaggio di Blackbird",          offset:+2, climate:"temperate"   },
        "65114266":{ name:"Mirelka",                         offset:+2, climate:"temperate"   },
        "65114232":{ name:"Kethra",                          offset:+2, climate:"temperate"   },
        "65114267":{ name:"Federazione di Ochima",           offset:+2, climate:"temperate"   },
        "65114269":{ name:"Isola Balena",                    offset:+2, climate:"temperate"   },
        "65114268":{ name:"Egypersia",                       offset:+2, climate:"subpolar"    }
    }
};

// ── MODIFICA MOBILE: crea #hxh-bar e lo inserisce in #ff_links dopo #skin-addon-box ──
;(function() {
    var bar = document.createElement('div');
    bar.id  = 'hxh-bar';
    function insertBar() {
        var ffLinks = document.querySelector('#ff_links');
        if (!ffLinks) { setTimeout(insertBar, 100); return; }
        var skinBox = document.querySelector('#skin-addon-box');
        if (skinBox && skinBox.nextSibling) {
            ffLinks.insertBefore(bar, skinBox.nextSibling);
        } else {
            ffLinks.appendChild(bar);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertBar);
    } else {
        insertBar();
    }
})();

/* ================================================================
   hxh-weather.js  (v3)
   Widget meteo on-game per Hunter x Hunter RPG su ForumFree.
   ================================================================ */

const WEATHER_BY_CLIMATE = {
  subtropical: {
    summer: [
      { label: "Afa",            icon: "wx-hot",     minT: 30, maxT: 38, weight: 5, requiresHot: true },
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 25, maxT: 35, weight: 3 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 24, maxT: 33, weight: 2 },
      { label: "Temporale",      icon: "wx-thunder", minT: 22, maxT: 30, weight: 2 },
      { label: "Vento caldo",    icon: "wx-windy",   minT: 25, maxT: 34, weight: 2 },
      { label: "Grandine",       icon: "wx-hail",    minT: 18, maxT: 27, weight: 1, maxDurationH: 1 },
    ],
    autumn: [
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 18, maxT: 25, weight: 2 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT: 14, maxT: 22, weight: 2 },
      { label: "Pioggia",        icon: "wx-rainy",   minT: 12, maxT: 20, weight: 3 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 15, maxT: 23, weight: 2 },
      { label: "Vento",          icon: "wx-windy",   minT: 14, maxT: 22, weight: 2 },
      { label: "Temporale",      icon: "wx-thunder", minT: 12, maxT: 19, weight: 2 },
    ],
    winter: [
      { label: "Pioggia",        icon: "wx-rainy",   minT:  5, maxT: 13, weight: 4 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  4, maxT: 12, weight: 3 },
      { label: "Temporale",      icon: "wx-thunder", minT:  5, maxT: 12, weight: 2 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT:  7, maxT: 14, weight: 2 },
      { label: "Soleggiato",     icon: "wx-sunny",   minT:  8, maxT: 15, weight: 1 },
      { label: "Vento",          icon: "wx-windy",   minT:  5, maxT: 13, weight: 2 },
    ],
    spring: [
      { label: "Vento",          icon: "wx-windy",   minT: 15, maxT: 23, weight: 4 },
      { label: "Pioggia",        icon: "wx-rainy",   minT: 13, maxT: 21, weight: 3 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT: 13, maxT: 21, weight: 2 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 15, maxT: 23, weight: 2 },
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 17, maxT: 25, weight: 2 },
      { label: "Temporale",      icon: "wx-thunder", minT: 13, maxT: 20, weight: 2 },
    ],
  },
  temperate: {
    summer: [
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 20, maxT: 28, weight: 3 },
      { label: "Temporale",      icon: "wx-thunder", minT: 16, maxT: 24, weight: 4 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 18, maxT: 26, weight: 3 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT: 15, maxT: 22, weight: 2 },
      { label: "Afa",            icon: "wx-hot",     minT: 28, maxT: 34, weight: 1, requiresHot: true },
      { label: "Grandine",       icon: "wx-hail",    minT: 14, maxT: 22, weight: 1, maxDurationH: 1 },
    ],
    autumn: [
      { label: "Pioggia",        icon: "wx-rainy",   minT:  6, maxT: 14, weight: 4 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  6, maxT: 15, weight: 3 },
      { label: "Vento",          icon: "wx-windy",   minT:  7, maxT: 15, weight: 3 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT:  9, maxT: 17, weight: 2 },
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 10, maxT: 18, weight: 1 },
      { label: "Temporale",      icon: "wx-thunder", minT:  6, maxT: 13, weight: 2 },
      { label: "Nebbia",         icon: "wx-foggy",   minT:  4, maxT: 11, weight: 3 },
    ],
    winter: [
      { label: "Neve",            icon: "wx-snow",     minT: -5, maxT:  2, weight: 4, requiresCold: true },
      { label: "Nevischio",       icon: "wx-snow",     minT: -2, maxT:  3, weight: 3, requiresCold: true },
      { label: "Gelido",          icon: "wx-freezing", minT: -5, maxT:  0, weight: 2 },
      { label: "Nuvoloso",        icon: "wx-cloudy",   minT: -1, maxT:  5, weight: 3 },
      { label: "Freddo e sereno", icon: "wx-sunny",    minT: -2, maxT:  4, weight: 2 },
      { label: "Pioggia",         icon: "wx-rainy",    minT:  1, maxT:  5, weight: 2 },
      { label: "Grandine",        icon: "wx-hail",     minT:  0, maxT:  5, weight: 1, maxDurationH: 1 },
    ],
    spring: [
      { label: "Pioggia",        icon: "wx-rainy",   minT:  8, maxT: 15, weight: 4 },
      { label: "Temporale",      icon: "wx-thunder", minT:  9, maxT: 16, weight: 3 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  8, maxT: 15, weight: 2 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 10, maxT: 18, weight: 2 },
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 12, maxT: 18, weight: 2 },
      { label: "Vento",          icon: "wx-windy",   minT:  9, maxT: 16, weight: 2 },
    ],
  },
  subpolar: {
    summer: [
      { label: "Soleggiato",     icon: "wx-sunny",   minT: 12, maxT: 20, weight: 3 },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT: 10, maxT: 18, weight: 3 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  8, maxT: 16, weight: 2 },
      { label: "Pioggia",        icon: "wx-rainy",   minT:  7, maxT: 14, weight: 2 },
      { label: "Vento",          icon: "wx-windy",   minT:  8, maxT: 16, weight: 2 },
      { label: "Temporale",      icon: "wx-thunder", minT:  8, maxT: 14, weight: 1 },
    ],
    autumn: [
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  2, maxT:  9, weight: 3 },
      { label: "Pioggia",        icon: "wx-rainy",   minT:  1, maxT:  8, weight: 3 },
      { label: "Vento",          icon: "wx-windy",   minT:  1, maxT:  8, weight: 3 },
      { label: "Neve",           icon: "wx-snow",    minT: -2, maxT:  2, weight: 3, requiresCold: true },
      { label: "Nevischio",      icon: "wx-snow",    minT:  0, maxT:  3, weight: 2, requiresCold: true },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT:  3, maxT: 10, weight: 1 },
    ],
    winter: [
      { label: "Neve abbondante", icon: "wx-snow",     minT:-12, maxT: -1, weight: 5, requiresCold: true },
      { label: "Neve",            icon: "wx-snow",     minT: -8, maxT:  0, weight: 4, requiresCold: true },
      { label: "Gelido",          icon: "wx-freezing", minT:-12, maxT: -3, weight: 3 },
      { label: "Nuvoloso",        icon: "wx-cloudy",   minT: -5, maxT:  0, weight: 2 },
      { label: "Freddo e sereno", icon: "wx-sunny",    minT: -8, maxT: -1, weight: 1 },
    ],
    spring: [
      { label: "Vento",          icon: "wx-windy",   minT:  0, maxT:  9, weight: 4 },
      { label: "Soleggiato",     icon: "wx-sunny",   minT:  2, maxT: 10, weight: 3 },
      { label: "Nuvoloso",       icon: "wx-cloudy",  minT:  0, maxT:  8, weight: 2 },
      { label: "Pioggia",        icon: "wx-rainy",   minT:  0, maxT:  7, weight: 2 },
      { label: "Neve",           icon: "wx-snow",    minT: -3, maxT:  1, weight: 2, requiresCold: true },
      { label: "Parz. nuvoloso", icon: "wx-partly",  minT:  1, maxT:  9, weight: 2 },
    ],
  },
};

const TRANSITION_MAP = {
  "wx-sunny":   { "wx-rainy": "wx-cloudy", "wx-thunder": "wx-partly", "wx-snow": "wx-cloudy", "wx-foggy": "wx-partly" },
  "wx-partly":  { "wx-rainy": "wx-cloudy", "wx-thunder": "wx-cloudy", "wx-snow": "wx-cloudy" },
  "wx-cloudy":  { "wx-sunny": "wx-partly" },
  "wx-rainy":   { "wx-sunny": "wx-cloudy", "wx-snow": "wx-cloudy" },
  "wx-thunder": { "wx-sunny": "wx-cloudy", "wx-partly": "wx-cloudy" },
  "wx-snow":    { "wx-sunny": "wx-cloudy", "wx-rainy": "wx-cloudy" },
  "wx-hot":     { "wx-rainy": "wx-partly", "wx-thunder": "wx-partly" },
};

var WORLD_TREE = [
  { id:"65073567", climate:"subtropical", children:[
    { id:"65114239", climate:"subtropical" },
    { id:"65114241", climate:"subtropical" },
    { id:"65114242", climate:"subtropical" },
    { id:"65114243", climate:"subtropical" }
  ]},
  { id:"65073568", climate:"temperate", children:[
    { id:"65114247", climate:"temperate"   },
    { id:"65114248", climate:"subtropical" },
    { id:"65114249", climate:"subtropical" }
  ]},
  { id:"65073569", climate:"temperate", children:[
    { id:"65114252", climate:"temperate"   },
    { id:"65114254", climate:"subpolar"    },
    { id:"65114255", climate:"temperate"   },
    { id:"65114253", climate:"subpolar"    }
  ]},
  { id:"65114231", climate:"temperate", children:[
    { id:"65114265", climate:"subtropical" },
    { id:"65114264", climate:"temperate"   },
    { id:"65114266", climate:"temperate"   }
  ]},
  { id:"65114232", climate:"temperate", children:[
    { id:"65114267", climate:"temperate"   },
    { id:"65114268", climate:"subpolar"    }
  ]},
  { id:"65114234", climate:"subtropical", children:[
    { id:"65114272", climate:"subtropical" }
  ]},
  { id:"65114233", climate:"subpolar", children:[
    { id:"65114270", climate:"subpolar"    },
    { id:"65114271", climate:"temperate"   }
  ]},
  { id:"65114235", climate:"temperate", children:[] }
];

function getContinentDelegate(continentId, gameDate) {
  var node = null;
  for (var i = 0; i < WORLD_TREE.length; i++) {
    if (WORLD_TREE[i].id === continentId) { node = WORLD_TREE[i]; break; }
  }
  if (!node || node.children.length === 0) return null;
  var eligible = node.children.filter(function(c) { return c.climate === node.climate; });
  if (eligible.length === 0) eligible = node.children;
  var doy  = Math.floor((gameDate - new Date(gameDate.getFullYear(), 0, 0)) / 86400000);
  var seed = gameDate.getFullYear() * 1000 + doy;
  return eligible[seed % eligible.length];
}

function getSeason(month) {
  if (month === 11 || month === 0 || month === 1) return "summer";
  if (month >= 2  && month <= 4)                  return "autumn";
  if (month >= 5  && month <= 7)                  return "winter";
  return "spring";
}

function isNight(hour, season) {
  if (season === "summer")                          return hour >= 20 || hour < 5;
  if (season === "spring" || season === "autumn")   return hour >= 19 || hour < 6;
  return hour >= 17 || hour < 7;
}

var TEMP_PEAKS = {
  summer: { peakHot: 16, peakCold: 5 },
  spring: { peakHot: 15, peakCold: 5 },
  autumn: { peakHot: 15, peakCold: 5 },
  winter: { peakHot: 14, peakCold: 5 },
};

function circularDist(a, b) {
  var d = Math.abs(a - b) % 24;
  return d > 12 ? 24 - d : d;
}

function dailyTempFactor(hour, season) {
  var p = TEMP_PEAKS[season];
  var distHot  = circularDist(hour, p.peakHot);
  var distCold = circularDist(hour, p.peakCold);
  return distCold / (distHot + distCold);
}

function seededRand(seed) {
  var s = (seed ^ 0xdeadbeef) >>> 0;
  return function() {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

function pickWeather(pool, rand, excludeHail) {
  var filtered = excludeHail ? pool.filter(function(w) { return w.icon !== "wx-hail"; }) : pool;
  var total = filtered.reduce(function(a, w) { return a + w.weight; }, 0);
  var r = rand() * total, acc = 0;
  for (var i = 0; i < filtered.length; i++) {
    acc += filtered[i].weight;
    if (r <= acc) return filtered[i];
  }
  return filtered[filtered.length - 1];
}

function getWeather(gameDate, locName, locClimate, locH) {
  var season  = getSeason(gameDate.getMonth());
  var climate = locClimate || "temperate";
  var pool    = WEATHER_BY_CLIMATE[climate][season];
  var doy      = Math.floor((gameDate - new Date(gameDate.getFullYear(), 0, 0)) / 86400000);
  var nameSeed = locName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
  var slotSize = (season === "spring" || season === "autumn") ? 2 : 3;
  var numSlots = Math.ceil(24 / slotSize);
  var currSlot = Math.floor(locH / slotSize);
  var prevSlot = (currSlot - 1 + numSlots) % numSlots;
  function slotSeed(slot) { return gameDate.getFullYear() * 100000 + doy * 100 + slot * 7 + nameSeed; }
  var wPrev = pickWeather(pool, seededRand(slotSeed(prevSlot)), false);
  var wCurr = pickWeather(pool, seededRand(slotSeed(currSlot)), wPrev.icon === "wx-hail");
  var randT    = seededRand(slotSeed(currSlot) + 999);
  var dayNoise = (randT() - 0.5) * 3;
  var tAtHot   = wCurr.maxT + dayNoise;
  var tAtCold  = wCurr.minT + dayNoise;
  var baseTemp = Math.round(tAtCold + dailyTempFactor(locH, season) * (tAtHot - tAtCold));
  function physCheck(w, t) {
    if (w.requiresCold && t > 2)  return pool.find(function(x) { return x.icon === "wx-rainy"; }) || w;
    if (w.requiresHot  && t < 28) return pool.find(function(x) { return x.icon === "wx-sunny"; }) || w;
    return w;
  }
  wCurr = physCheck(wCurr, baseTemp);
  wPrev = physCheck(wPrev, baseTemp);
  var transIcon = (TRANSITION_MAP[wPrev.icon] && TRANSITION_MAP[wPrev.icon][wCurr.icon]) ? TRANSITION_MAP[wPrev.icon][wCurr.icon] : null;
  var showTrans = transIcon && (locH % slotSize === 0);
  var finalIcon  = showTrans ? transIcon : wCurr.icon;
  var finalLabel = showTrans ? ((pool.find(function(w) { return w.icon === transIcon; }) || { label: "Variabile" }).label) : wCurr.label;
  if (HXH.DEBUG_WEATHER) {
    var dbg = HXH.DEBUG_WEATHER, dbgNight = false;
    if (dbg.indexOf("night:") === 0) { dbgNight = true; dbg = dbg.slice(6); }
    return { label: "[DBG] " + dbg, icon: dbg, temp: baseTemp, nightOverride: dbgNight };
  }
  return { label: finalLabel, icon: finalIcon, temp: baseTemp };
}

function getGameTime() {
  var realElapsedMs = Date.now() - HXH.REAL_EPOCH.getTime();
  var msPerGameDay  = HXH.MINS_PER_GAME_DAY * 60 * 1000;
  var gameDate      = new Date(HXH.GAME_EPOCH.getTime() + realElapsedMs * (86400000 / msPerGameDay));
  return { gameDate: gameDate, h: gameDate.getUTCHours(), m: gameDate.getUTCMinutes() };
}

function applyOffset(h, off) { return ((h + off) % 24 + 24) % 24; }
function pad(n) { return String(n).padStart(2, "0"); }
var MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

function detectLoc() {
  var url = window.location.href;
  for (var id in HXH.SECTION_MAP) {
    if (url.includes(id)) {
      var loc = HXH.SECTION_MAP[id];
      return { id: id, name: loc.name, offset: loc.offset, climate: loc.climate };
    }
  }
  var d = HXH.DEFAULT_LOC;
  return { id: d.id, name: d.name, offset: d.offset, climate: d.climate };
}

function mk(tag, cls) { var el = document.createElement(tag); if (cls) el.className = cls; return el; }
function mkI(cls) { var i = document.createElement("i"); i.className = cls; return i; }

function buildMoonSvg(fill, cx, cy, r, maskCx, maskCy, maskR, rotateDeg, holeStars, extraStars) {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "moon-svg");
  svg.setAttribute("viewBox", "0 0 90 90");
  svg.setAttribute("overflow", "visible");
  var defs = document.createElementNS(ns, "defs");
  var mid  = "mm" + Math.random().toString(36).slice(2, 8);
  var mask = document.createElementNS(ns, "mask"); mask.setAttribute("id", mid);
  var g = document.createElementNS(ns, "g");
  g.setAttribute("transform", "rotate(" + rotateDeg + "," + cx + "," + cy + ")");
  var c1 = document.createElementNS(ns, "circle");
  c1.setAttribute("cx", cx); c1.setAttribute("cy", cy); c1.setAttribute("r", r); c1.setAttribute("fill", "white");
  var c2 = document.createElementNS(ns, "circle");
  c2.setAttribute("cx", maskCx); c2.setAttribute("cy", maskCy); c2.setAttribute("r", maskR); c2.setAttribute("fill", "black");
  g.appendChild(c1); g.appendChild(c2); mask.appendChild(g); defs.appendChild(mask); svg.appendChild(defs);
  var moon = document.createElementNS(ns, "circle");
  moon.setAttribute("cx", cx); moon.setAttribute("cy", cy); moon.setAttribute("r", r);
  moon.setAttribute("fill", fill); moon.setAttribute("mask", "url(#" + mid + ")");
  svg.appendChild(moon);
  var stars = (holeStars ? [[57,33,2,"white","n-star-1"],[65,42,1.4,"white","n-star-3"]] : []).concat(extraStars || []);
  for (var i = 0; i < stars.length; i++) {
    var sc = document.createElementNS(ns, "circle");
    sc.setAttribute("cx", stars[i][0]); sc.setAttribute("cy", stars[i][1]); sc.setAttribute("r", stars[i][2]);
    sc.setAttribute("fill", stars[i][3]); sc.setAttribute("class", stars[i][4]);
    svg.appendChild(sc);
  }
  return svg;
}

function buildWeatherIcon(cls, night) {
  var wrap = mk("div", "wx-icon " + cls);
  if (night && cls === "wx-sunny") {
    wrap.className += " wx-night";
    wrap.appendChild(buildMoonSvg("#ddeeff", 45, 45, 24, 58, 35, 20, 5, true, [[14,16,2.2,"white","n-star-1"],[74,12,1.8,"white","n-star-2"],[80,50,1.5,"white","n-star-3"],[12,70,1.6,"white","n-star-4"],[70,74,1.3,"white","n-star-5"]]));
    return wrap;
  }
  if (night && cls === "wx-partly") {
    wrap.className += " wx-night has-cloud";
    var svg2 = buildMoonSvg("#ddeeff", 70, 26, 23, 81, 16, 19, 5, false, [[77,14,1.8,"white","n-star-2"],[83,22,1.3,"white","n-star-4"],[8,12,1.8,"white","n-star-1"],[25,6,1.5,"white","n-star-3"],[45,10,1.3,"white","n-star-5"],[6,32,1.4,"white","n-star-2"]]);
    svg2.setAttribute("width", "100%"); svg2.setAttribute("height", "100%");
    wrap.appendChild(svg2); wrap.appendChild(mk("div", "cloud")); return wrap;
  }
  if (night && cls === "wx-hot") {
    wrap.className += " wx-night";
    var moonSvg = buildMoonSvg("#ddeeff", 45, 45, 24, 58, 35, 20, 5, false, [[14,16,2.0,"white","n-star-1"],[74,12,1.6,"white","n-star-2"],[80,52,1.4,"white","n-star-3"],[12,68,1.5,"white","n-star-4"]]);
    wrap.appendChild(moonSvg); wrap.appendChild(mk("div", "wx-hot-night-aura")); return wrap;
  }
  if (night && cls === "wx-foggy") {
    wrap.className += " wx-night";
    wrap.appendChild(buildMoonSvg("#99ccee", 45, 45, 24, 58, 35, 20, 5, true, [[16,22,1.6,"rgba(180,220,255,0.8)","n-star-3"],[74,18,1.4,"rgba(180,220,255,0.8)","n-star-5"],[78,55,1.2,"rgba(180,220,255,0.7)","n-star-1"]]));
    wrap.appendChild(mk("div", "fog")); return wrap;
  }
  if (cls === "wx-sunny") { var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun); }
  else if (cls === "wx-partly") { wrap.appendChild(mk("div", "cloud")); var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun); }
  else if (cls === "wx-cloudy") { wrap.appendChild(mk("div", "cloud")); wrap.appendChild(mk("div", "cloud back")); }
  else if (cls === "wx-rainy")  { wrap.appendChild(mk("div", "cloud")); wrap.appendChild(mk("div", "rain")); }
  else if (cls === "wx-thunder") { wrap.appendChild(mk("div", "cloud")); var li = mk("div", "lightning"); li.appendChild(mk("div", "bolt")); li.appendChild(mk("div", "bolt")); wrap.appendChild(li); }
  else if (cls === "wx-snow") { wrap.appendChild(mk("div", "cloud")); var sn = mk("div", "snow"); for (var si = 0; si < 4; si++) { var sf = mk("div", "snowflake"); var sp = mk("span"); sp.textContent = String.fromCharCode(10052); sf.appendChild(sp); sn.appendChild(sf); } wrap.appendChild(sn); }
  else if (cls === "wx-foggy")   { wrap.appendChild(mk("div", "fog-sun")); wrap.appendChild(mk("div", "fog")); }
  else if (cls === "wx-windy") {
    var ns3 = "http://www.w3.org/2000/svg"; var wsvg = document.createElementNS(ns3, "svg"); wsvg.setAttribute("viewBox", "0 0 80 60");
    ["wx-wline-1","wx-wline-2","wx-wline-3"].forEach(function(id) { var u = document.createElementNS(ns3, "use"); u.setAttribute("href", "#" + id); u.setAttribute("class", "w-line"); wsvg.appendChild(u); });
    [[18,22,2.2,"w-dot"],[30,34,2,"w-dot w-dot-2"],[10,10,1.8,"w-dot w-dot-3"]].forEach(function(d) { var c = document.createElementNS(ns3, "circle"); c.setAttribute("cx", d[0]); c.setAttribute("cy", d[1]); c.setAttribute("r", d[2]); c.setAttribute("class", d[3]); wsvg.appendChild(c); });
    wrap.appendChild(wsvg);
  }
  else if (cls === "wx-hail")     { var h = mk("div", "hail"); h.appendChild(mk("div", "hail-extra")); wrap.appendChild(mk("div", "cloud")); wrap.appendChild(h); }
  else if (cls === "wx-freezing") { var ic = mk("div", "ice-crystal"); ic.textContent = String.fromCharCode(10052); wrap.appendChild(ic); }
  else if (cls === "wx-hot")      { wrap.className = "wx-icon icon hot"; var sun = mk("div", "sun"); sun.appendChild(mk("div", "rays")); wrap.appendChild(sun); }
  else if (cls === "wx-tornado")  { var funnel = mk("div", "tornado-funnel"); for (var ti = 0; ti < 5; ti++) funnel.appendChild(mk("div", "harsh-wind")); wrap.appendChild(funnel); }
  else if (cls === "wx-tsunami")  { var ww = mk("div", "wave-wrapper"); ww.appendChild(mk("div", "wave one")); ww.appendChild(mk("div", "wave two")); ww.appendChild(mk("div", "wave three")); wrap.appendChild(ww); }
  else if (cls === "wx-blizzard") { wrap.appendChild(mk("div", "ice-aura")); var bic = mk("div", "ice-crystal"); bic.textContent = String.fromCharCode(10052); wrap.appendChild(bic); }
  return wrap;
}

var _overrides = {};

function loadOverrides() {
  fetch("https://huntermeteo-default-rtdb.europe-west1.firebasedatabase.app/overrides.json")
    .then(function(r) { return r.json(); })
    .then(function(data) { _overrides = data || {}; updateWidget(); })
    .catch(function() {});
}

function getOverride(sectionId) {
  if (_overrides[sectionId]) return _overrides[sectionId];
  if (_overrides["global"])  return _overrides["global"];
  return null;
}

var _state = { icon: null, night: null };

/* ================================================================
   INIT — costruisce la struttura DOM e la inserisce in #hxh-bar
   (bar è già stato posizionato in #ff_links dall'IIFE in cima)
   ================================================================ */
function initWidget() {
  var bar = document.getElementById("hxh-bar");
  if (!bar) return;

  // ── MODIFICA MOBILE: niente trigger, solo card sempre visibile ──
  var card = mk("div", "hxh-card");
  card.appendChild(mk("div", "hxh-corners"));

  var head = mk("div", "hxh-head");
  head.appendChild(mkI("fa-solid fa-location-dot"));
  head.appendChild(mk("span", "hxh-head-name"));
  card.appendChild(head);

  var timeBlock = mk("div", "hxh-time-block");
  var timeLabel = mk("div", "hxh-time-label");
  timeLabel.textContent = "Ora locale";
  timeBlock.appendChild(timeLabel);
  timeBlock.appendChild(mk("div", "hxh-time-display"));
  card.appendChild(timeBlock);

  var dateBlock = mk("div", "hxh-date-block");
  dateBlock.appendChild(mkI("fa-regular fa-calendar"));
  dateBlock.appendChild(mk("span", "hxh-date-text"));
  card.appendChild(dateBlock);

  var wBlock = mk("div", "hxh-weather-block");
  var wRow   = mk("div", "hxh-weather-row");
  wRow.appendChild(mk("div", "hxh-weather-icon-wrap"));
  var wInfo = mk("div");
  wInfo.appendChild(mk("div", "hxh-weather-label"));
  wInfo.appendChild(mk("div", "hxh-weather-temp"));
  wRow.appendChild(wInfo);
  wBlock.appendChild(wRow);
  card.appendChild(wBlock);

  var footer = mk("div", "hxh-footer-deco");
  footer.appendChild(mk("div", "hxh-footer-line"));
  var diamond = mk("span", "hxh-footer-diamond");
  diamond.textContent = "\u25C6 \u25C6 \u25C6";
  footer.appendChild(diamond);
  footer.appendChild(mk("div", "hxh-footer-line"));
  card.appendChild(footer);

  bar.appendChild(card);
  updateWidget();
}

function updateWidget() {
  var bar = document.getElementById("hxh-bar");
  if (!bar) return;

  var gt      = getGameTime();
  var loc     = detectLoc();
  var locH    = applyOffset(gt.h, loc.offset);
  var season  = getSeason(gt.gameDate.getMonth());
  var night   = isNight(locH, season);

  var weatherLocName    = loc.name;
  var weatherLocClimate = loc.climate;
  var isCont = false;
  for (var wi = 0; wi < WORLD_TREE.length; wi++) {
    if (WORLD_TREE[wi].id === loc.id) { isCont = true; break; }
  }
  if (isCont) {
    var delegate = getContinentDelegate(loc.id, gt.gameDate);
    if (delegate) {
      var delEntry = HXH.SECTION_MAP[delegate.id];
      if (delEntry) {
        weatherLocName    = delEntry.name;
        weatherLocClimate = delegate.climate;
        locH = applyOffset(gt.h, delEntry.offset);
      }
    }
  }

  var override = getOverride(loc.id);
  var weather  = getWeather(gt.gameDate, weatherLocName, weatherLocClimate, locH);
  if (override) {
    if (override.icon)  { weather.icon = override.icon; weather.label = override.label; }
    if (override.temp) {
      if (override.temp.mode === "abs")   weather.temp = override.temp.val;
      if (override.temp.mode === "plus")  weather.temp = weather.temp + override.temp.val;
      if (override.temp.mode === "minus") weather.temp = weather.temp - override.temp.val;
      weather.temp = Math.round(weather.temp);
    }
  }
  if (weather.nightOverride !== undefined) night = weather.nightOverride;

  var el;
  el = bar.querySelector(".hxh-head-name");     if (el) el.textContent = loc.name;
  el = bar.querySelector(".hxh-time-display");  if (el) el.textContent = pad(locH) + ":" + pad(gt.m);
  el = bar.querySelector(".hxh-date-text");     if (el) el.textContent = gt.gameDate.getUTCDate() + " " + MONTHS[gt.gameDate.getUTCMonth()] + " " + gt.gameDate.getUTCFullYear();
  var displayLabel = (weather.icon === "wx-sunny" && night) ? "Sereno" : weather.label;
  if (weather.icon === "wx-tornado" && loc.climate === "subtropical") displayLabel = "Uragano";
  el = bar.querySelector(".hxh-weather-label"); if (el) el.textContent = displayLabel;
  el = bar.querySelector(".hxh-weather-temp");  if (el) el.textContent = (weather.temp > 0 ? "+" : "") + weather.temp + "\u00b0C";

  if (weather.icon !== _state.icon || night !== _state.night) {
    el = bar.querySelector(".hxh-weather-icon-wrap");
    if (el) { el.innerHTML = ""; el.appendChild(buildWeatherIcon(weather.icon, night)); }
    _state.icon  = weather.icon;
    _state.night = night;
  }
}

function hxhStart() {
  initWidget();
  loadOverrides();

  var _lastNight = null;
  setInterval(function() {
    var gt     = getGameTime();
    var loc    = detectLoc();
    var locH   = applyOffset(gt.h, loc.offset);
    var season = getSeason(gt.gameDate.getMonth());
    var night  = isNight(locH, season);
    var el = document.querySelector(".hxh-time-display");
    if (el) el.textContent = pad(locH) + ":" + pad(gt.m);
    if (_lastNight !== null && night !== _lastNight) updateWidget();
    _lastNight = night;
  }, 10000);

  setInterval(updateWidget, 60 * 1000);
  setInterval(loadOverrides, 60 * 1000);
}

/* ================================================================
   STILI — card sempre visibile, niente trigger
   ================================================================ */
(function() {
  var s = document.createElement('style');
  s.textContent = '';
  s.textContent += '#hxh-bar { font-family: \'Montserrat\', Georgia, serif; }\n';
  s.textContent += '.hxh-card { display: block; width: 100%; border-radius: 6px; overflow: hidden; background: linear-gradient(160deg, #0e2a2a 0%, #0B2533 60%, #0e1f2e 100%); border: 1px solid #3B8686; box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(143,190,186,0.12); }\n';
  s.textContent += '.hxh-card::before { content: \'\'; position: absolute; inset: 0; background-image: radial-gradient(ellipse at 80% 0%, rgba(59,134,134,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(11,72,107,0.2) 0%, transparent 60%); pointer-events: none; z-index: 0; }\n';
  s.textContent += '.hxh-card > * { position: relative; z-index: 1; }\n';
  s.textContent += '.hxh-corners { position: absolute; inset: 0; pointer-events: none; z-index: 3; }\n';
  s.textContent += '.hxh-corners::before, .hxh-corners::after { content: \'\'; position: absolute; width: 9px; height: 9px; border-color: #79BD9A; border-style: solid; opacity: 0.55; }\n';
  s.textContent += '.hxh-corners::before { top: 4px; left: 4px; border-width: 1px 0 0 1px; }\n';
  s.textContent += '.hxh-corners::after { top: 4px; right: 4px; border-width: 1px 1px 0 0; }\n';
  s.textContent += '.hxh-head { padding: 9px 13px 8px; border-bottom: 1px solid rgba(59,134,134,0.4); display: flex; align-items: center; gap: 7px; background: rgba(11,72,107,0.35); }\n';
  s.textContent += '.hxh-head i { font-size: 10px; color: #79BD9A; flex-shrink: 0; vertical-align: middle; }\n';
  s.textContent += '.hxh-head-name { font-family: \'Montserrat\', serif; font-size: 9px; letter-spacing: 2.2px; text-transform: uppercase; color: #CFF09E; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }\n';
  s.textContent += '.hxh-time-block { padding: 11px 13px 9px; border-bottom: 1px solid rgba(59,134,134,0.25); }\n';
  s.textContent += '.hxh-time-label { font-family: \'Montserrat\', serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #3B8686; margin-bottom: 3px; }\n';
  s.textContent += '.hxh-time-display { font-family: \'Courier New\', monospace; font-size: 28px; font-weight: bold; color: #E2F7C4; letter-spacing: 3px; line-height: 1; animation: hxh-glow 3.5s ease-in-out infinite; }\n';
  s.textContent += '.hxh-date-block { padding: 7px 13px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(59,134,134,0.25); background: rgba(11,72,107,0.15); }\n';
  s.textContent += '.hxh-date-block i { font-size: 10px; color: #3B8686; width: 11px; text-align: center; flex-shrink: 0; }\n';
  s.textContent += '.hxh-date-text { font-size: 13px; color: #8FBEBA; letter-spacing: 0.3px; }\n';
  s.textContent += '.hxh-weather-block { padding: 10px 13px 12px; }\n';
  s.textContent += '.hxh-weather-row { display: flex; align-items: center; gap: 10px; }\n';
  s.textContent += '.hxh-weather-icon-wrap { width: 60px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }\n';
  s.textContent += '.hxh-weather-label { font-size: 14px; color: #CFF09E; font-style: italic; line-height: 1.2; margin-left: -10px; }\n';
  s.textContent += '.hxh-weather-temp { font-family: \'Montserrat\', serif; font-size: 10.5px; color: #79BD9A; letter-spacing: 0.8px; margin-top: 1px; margin-left: -16px; }\n';
  s.textContent += '.hxh-footer-deco { border-top: 1px solid rgba(59,134,134,0.3); padding: 5px 13px 6px; display: flex; align-items: center; gap: 6px; background: rgba(11,72,107,0.2); }\n';
  s.textContent += '.hxh-footer-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(121,189,154,0.4), transparent); }\n';
  s.textContent += '.hxh-footer-diamond { font-size: 6px; color: #3B8686; letter-spacing: 3px; }\n';
  s.textContent += '@keyframes hxh-glow { 0%, 100% { text-shadow: 0 0 8px rgba(226,247,196,0.2); } 50% { text-shadow: 0 0 18px rgba(226,247,196,0.5); } }\n';
  s.textContent += '.wx-icon { position: relative; display: inline-block; width: 10em; height: 8em; font-size: 4.2px; color: #b0bec5; }\n';
  s.textContent += '.cloud { position: absolute; z-index: 1; top: 50%; left: 50%; width: 3.6875em; height: 3.6875em; margin: -1.84375em; background: currentColor; border-radius: 50%; box-shadow: -2.1875em 0.6875em 0 -0.6875em, 2.0625em 0.9375em 0 -0.9375em, 0 0 0 0.375em #fff, -2.1875em 0.6875em 0 -0.3125em #fff, 2.0625em 0.9375em 0 -0.5625em #fff; }\n';
  s.textContent += '.cloud::after { content: ""; position: absolute; bottom: 0; left: -0.5em; display: block; width: 4.5625em; height: 1em; background: currentColor; box-shadow: 0 0.4375em 0 -0.0625em #fff; }\n';
  s.textContent += '.cloud.back { z-index: 0; background: #fff; box-shadow: -2.1875em 0.6875em 0 -0.6875em #fff, 2.0625em 0.9375em 0 -0.9375em #fff, 0 0 0 0.375em #fff, -2.1875em 0.6875em 0 -0.3125em #fff, 2.0625em 0.9375em 0 -0.5625em #fff; opacity:1; transform: scale(0.5) translate(7.5em, -3em); animation: cloud-drift 4s linear infinite; }\n';
  s.textContent += '.cloud.back::after { background: #fff; }\n';
  s.textContent += '.sun { position: absolute; top: 50%; left: 50%; width: 2.5em; height: 2.5em; margin: -1.25em; background: currentColor; border-radius: 50%; box-shadow: 0 0 0 0.375em #fff; animation: wx-spin 12s linear infinite; }\n';
  s.textContent += '.rays { position: absolute; top: -2em; left: 50%; display: block; width: 0.375em; height: 1.125em; margin-left: -0.1875em; background: #fff; border-radius: 0.25em; box-shadow: 0 5.375em #fff; }\n';
  s.textContent += '.rays::before, .rays::after { content: ""; position: absolute; top: 0; left: 0; width: 0.375em; height: 1.125em; background: #fff; border-radius: 0.25em; box-shadow: 0 5.375em #fff; }\n';
  s.textContent += '.rays::before { transform: rotate(60deg); transform-origin: 50% 3.25em; }\n';
  s.textContent += '.rays::after { transform: rotate(120deg); transform-origin: 50% 3.25em; }\n';
  s.textContent += '.cloud + .sun { margin: -2em 1em; }\n';
  s.textContent += '.rain, .lightning, .hail { position: absolute; z-index: 2; top: 50%; left: 50%; margin: 3.8em 0 0 -1em; }\n';
  s.textContent += '.snow { position: absolute; z-index: 2; top: 50%; left: 50%; margin: 2.6em 0 0 -1em; }\n';
  s.textContent += '.fog, .wind-lines { position: absolute; z-index: 2; top: 50%; left: 50%; transform: translate(-50%, -50%); }\n';
  s.textContent += '.rain::after { content: ""; position: absolute; z-index: 2; top: 50%; left: 50%; width: 1.125em; height: 1.125em; margin: -1em 0 0 -0.25em; background: #6cf; border-radius: 100% 0 60% 50% / 60% 0 100% 50%; box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 rgba(255,255,255,0.2); transform: rotate(-28deg); animation: wx-rain 2.5s linear infinite; }\n';
  s.textContent += '.bolt { position: absolute; top: 50%; left: 50%; margin: -0.25em 0 0 -0.125em; color: #fff; opacity: 0.3; animation: wx-lightning 2s linear infinite; }\n';
  s.textContent += '.bolt:nth-child(2) { width: 1em; height: 0em; margin: -1.75em 0 0 -1.875em; transform: translate(2.5em,2.25em); opacity: 0.2; animation: wx-lightning 1.5s linear infinite; }\n';
  s.textContent += '.bolt::before, .bolt::after { content: ""; position: absolute; z-index: 2; top: 50%; left: 50%; margin: -1.625em 0 0 -1.0125em; border-top: 1.25em solid transparent; border-right: 0.75em solid; border-bottom: 0.75em solid; border-left: 0.5em solid transparent; transform: skewX(-10deg); }\n';
  s.textContent += '.bolt::after { margin: -0.25em 0 0 -0.25em; border-top: 0.75em solid; border-right: 0.5em solid transparent; border-bottom: 1.25em solid transparent; border-left: 0.75em solid; }\n';
  s.textContent += '.bolt:nth-child(2)::before { margin: -0.75em 0 0 -0.5em; border-top: 1.1em solid transparent; border-right: 0.65em solid; border-bottom: 0.65em solid; border-left: 0.45em solid transparent }\n';
  s.textContent += '.bolt:nth-child(2)::after { margin: -0.125em 0 0 -0.125em; border-top: 0.65em solid; border-right: 0.45em solid transparent; border-bottom: 1.1em solid transparent; border-left: 0.65em solid }\n';
  s.textContent += '.snowflake { position: absolute; top: 0; color: #fff !important; line-height: 1; animation: wx-snowfall linear infinite; }\n';
  s.textContent += '.snowflake span { display: block; color: #fff !important; animation: wx-spin linear infinite; }\n';
  s.textContent += '.snowflake:nth-child(1) { left: -0.8em; font-size: 1.4em; opacity: 0.9; animation-duration: 2.2s; animation-delay: 0s; }\n';
  s.textContent += '.snowflake:nth-child(2) { left:  0.4em; font-size: 1.0em; opacity: 0.7; animation-duration: 2.7s; animation-delay: 0.7s; }\n';
  s.textContent += '.snowflake:nth-child(3) { left:  1.4em; font-size: 1.2em; opacity: 0.8; animation-duration: 2.0s; animation-delay: 1.4s; }\n';
  s.textContent += '.snowflake:nth-child(4) { left: -0.1em; font-size: 0.8em; opacity: 0.55; animation-duration: 2.5s; animation-delay: 0.35s; }\n';
  s.textContent += '.snowflake:nth-child(1) span { animation-duration: 6s; }\n';
  s.textContent += '.snowflake:nth-child(2) span { animation-duration: 9s; animation-direction: reverse; }\n';
  s.textContent += '.snowflake:nth-child(3) span { animation-duration: 7s; }\n';
  s.textContent += '.snowflake:nth-child(4) span { animation-duration: 11s; animation-direction: reverse; }\n';
  s.textContent += '.hail::before { content: ""; position: absolute; top: 0; left: 0.3em; width: 0.85em; height: 0.85em; background: #aef; border-radius: 50%; animation: wx-hail 1s ease-in infinite 0s; }\n';
  s.textContent += '.hail::after { content: ""; position: absolute; top: 0; left: 1.5em; width: 0.75em; height: 0.75em; background: #aef; border-radius: 50%; animation: wx-hail 1s ease-in infinite 0.35s; }\n';
  s.textContent += '.hail-extra { position: absolute; top: 0; left: -0.1em; width: 0.65em; height: 0.65em; background: rgba(174,238,255,0.7); border-radius: 50%; animation: wx-hail 1s ease-in infinite 0.65s; }\n';
  s.textContent += '.wx-foggy .fog-sun { position: absolute; top: 50%; left: 50%; width: 5em; height: 5em; margin: -2.5em 0 0 -2.5em; background: radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(255,180,50,0.6) 60%, rgba(255,150,30,0.2) 100%); border-radius: 50%; box-shadow: 0 0 1.5em rgba(255,200,80,0.4); }\n';
  s.textContent += '.fog::before { content: ""; position: absolute; top: 50%; left: 50%; width: 7em; height: 0.55em; margin: -0.2em 0 0 -3.8em; background: rgba(220,220,220,0.92); border-radius: 0.3em; box-shadow: 0.3em 1.3em 0 0.05em rgba(220,220,220,0.82); animation: wx-fog 3s ease-in-out infinite; }\n';
  s.textContent += '.fog::after { content: ""; position: absolute; top: 50%; left: 50%; width: 5.5em; height: 0.55em; margin: 1.1em 0 0 -2.7em; background: rgba(210,210,210,0.78); border-radius: 0.3em; box-shadow: -0.4em 1.3em 0 0.03em rgba(210,210,210,0.65); animation: wx-fog 3s ease-in-out infinite 1.5s; }\n';
  s.textContent += '.wx-windy svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 8em; height: 6em; overflow: visible; }\n';
  s.textContent += '.wx-windy .w-line { fill: none; stroke: rgba(255,255,255,0.85); stroke-width: 2.8; stroke-linecap: round; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(2) { stroke: rgba(255,255,255,0.7); }\n';
  s.textContent += '.wx-windy .w-line:nth-child(3) { stroke: rgba(255,255,255,0.55); }\n';
  s.textContent += '.wx-windy .w-line:nth-child(1) { animation: wx-wind-draw 2.8s ease-in-out infinite 0.4s; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(2) { animation: wx-wind-draw 2.8s ease-in-out infinite 0s; }\n';
  s.textContent += '.wx-windy .w-line:nth-child(3) { animation: wx-wind-draw 2.8s ease-in-out infinite 0.8s; }\n';
  s.textContent += '.wx-windy .w-dot { fill: rgba(255,255,255,0.75); animation: wx-wind-dot 1.4s ease-in-out infinite; }\n';
  s.textContent += '.wx-windy .w-dot-2 { animation-delay: 0.45s; }\n';
  s.textContent += '.wx-windy .w-dot-3 { animation-delay: 0.9s; }\n';
  s.textContent += '.wx-night .moon-svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10em; height: 10em; overflow: visible; z-index: 0; }\n';
  s.textContent += '.wx-night.has-cloud .moon-svg { width: 100%; height: 100%; }\n';
  s.textContent += '.n-star-1 { animation: wx-star 2.8s ease-in-out infinite; }\n';
  s.textContent += '.n-star-2 { animation: wx-star 2.8s ease-in-out infinite 1s; }\n';
  s.textContent += '.n-star-3 { animation: wx-star 2.8s ease-in-out infinite 2s; }\n';
  s.textContent += '.n-star-4 { animation: wx-star 2.8s ease-in-out infinite 1.5s; }\n';
  s.textContent += '.n-star-5 { animation: wx-star 2.8s ease-in-out infinite 0.5s; }\n';
  s.textContent += '.ice-crystal { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #adf; font-size: 6em; line-height: 1; text-shadow: 0 0 0.15em rgba(170,220,255,1), 0 0 0.4em rgba(170,220,255,0.6); animation: wx-spin-center 14s linear infinite; }\n';
  s.textContent += '.ice-crystal::before { content: "\\2744"; position: absolute; font-size: 0.4em; top: 0.3em; left: -0.8em; opacity: 0.55; animation: wx-spin 8s linear infinite reverse; }\n';
  s.textContent += '.ice-crystal::after { content: "\\2744"; position: absolute; font-size: 0.35em; top: 1.6em; left: 2em; opacity: 0.4; animation: wx-spin 6s linear infinite; }\n';
  s.textContent += '.wx-hot-night-aura { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 6em; height: 6em; border-radius: 50%; background: radial-gradient(circle, transparent 35%, rgba(255,120,0,0.22) 60%, rgba(255,80,0,0.10) 80%, transparent 100%); animation: hot-night-pulse 3s ease-in-out infinite; z-index: 1; pointer-events: none; }\n';
  s.textContent += '@keyframes hot-night-pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; } 50% { transform: translate(-50%,-50%) scale(1.35); opacity: 1.0; } }\n';
  s.textContent += '.icon.hot, .wx-hot { color: #f93; }\n';
  s.textContent += '.wx-hot .sun, .icon.hot .sun { background: #f93; box-shadow: 0 0 0 0.375em #fff; animation: wx-spin 12s linear infinite, wx-hot-pulse 2.5s ease-in-out infinite; }\n';
  s.textContent += '@keyframes wx-spin { 100% { transform: rotate(360deg); } }\n';
  s.textContent += '@keyframes wx-spin-center { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }\n';
  s.textContent += '@keyframes cloud-drift { 0% { opacity:0; } 50% { opacity:0.7; } 100% { opacity:0; transform: scale(0.5) translate(-240%,-4em); } }\n';
  s.textContent += '@keyframes wx-rain { 0% { background:#6cf; box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 #6cf; } 25% { box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em #6cf, -1.375em -0.125em 0 rgba(255,255,255,0.2); } 50% { background:rgba(255,255,255,0.3); box-shadow: 0.625em 0.875em 0 -0.125em #6cf, -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 rgba(255,255,255,0.2); } 100% { box-shadow: 0.625em 0.875em 0 -0.125em rgba(255,255,255,0.2), -0.875em 1.125em 0 -0.125em rgba(255,255,255,0.2), -1.375em -0.125em 0 #6cf; } }\n';
  s.textContent += '@keyframes wx-lightning { 45% { color:#fff; background:#fff; opacity:0.2; } 50% { color:#0cf; background:#0cf; opacity:1; } 55% { color:#fff; background:#fff; opacity:0.2; } }\n';
  s.textContent += '@keyframes wx-snowfall { 0% { transform:translateY(0); opacity:0; } 15% { opacity:1; } 85% { opacity:0.9; } 100% { transform:translateY(2.2em); opacity:0; } }\n';
  s.textContent += '@keyframes wx-hail { 0% { transform:translateY(0); opacity:1; } 80% { opacity:0.8; } 100% { transform:translateY(2em); opacity:0; } }\n';
  s.textContent += '@keyframes wx-fog { 0%,100% { transform:translateX(0); opacity:0.7; } 50% { transform:translateX(0.5em); opacity:0.4; } }\n';
  s.textContent += '@keyframes wx-wind-draw { 0% { transform:translateX(-12px); opacity:0; } 20% { opacity:1; } 80% { opacity:1; } 100% { transform:translateX(12px); opacity:0; } }\n';
  s.textContent += '@keyframes wx-wind-dot { 0% { transform:translateX(-10px); opacity:0; } 20% { opacity:0.85; } 80% { opacity:0.85; } 100% { transform:translateX(14px); opacity:0; } }\n';
  s.textContent += '@keyframes wx-star { 0%,100% { opacity:1; } 50% { opacity:0.2; } }\n';
  s.textContent += '@keyframes wx-hot-pulse { 0%,100% { box-shadow:0 0 0 0.375em #fff, 0 0 0 0.9em rgba(255,153,0,0.2); } 50% { box-shadow:0 0 0 0.375em #fff, 0 0 0 1.4em rgba(255,153,0,0.3); } }\n';
  s.textContent += '.tornado-funnel { position:absolute; top:8%; left:50%; transform:translateX(-42%) rotate(-10deg); }\n';
  s.textContent += '.harsh-wind { margin:0.35em 0; background:#b0bec5; border-radius:0.2em; height:0.7em; animation:harsh-wind 2s infinite ease-in-out; }\n';
  s.textContent += '.harsh-wind:nth-child(1) { width:6.5em; animation-delay:0s; }\n';
  s.textContent += '.harsh-wind:nth-child(2) { width:4em; animation-delay:0.3s; margin-left:1em; }\n';
  s.textContent += '.harsh-wind:nth-child(3) { width:2.2em; animation-delay:0.6s; margin-left:1.9em; }\n';
  s.textContent += '.harsh-wind:nth-child(4) { width:1em; animation-delay:0.9s; margin-left:2.5em; }\n';
  s.textContent += '.harsh-wind:nth-child(5) { width:0.5em; animation-delay:1.2s; margin-left:2.85em; }\n';
  s.textContent += '@keyframes harsh-wind { 0% { transform:translateX(-0.5em); } 50% { transform:translateX(0.5em); } 100% { transform:translateX(-0.5em); } }\n';
  s.textContent += '.wave-wrapper { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:7em; height:7em; overflow:hidden; border-radius:50%; }\n';
  s.textContent += '.wave { position:absolute; top:42%; left:-50%; width:14em; height:14em; border-radius:25%; animation:waves linear infinite; }\n';
  s.textContent += '.wave.one   { background-color:#3a6aaa; animation-duration:7s; }\n';
  s.textContent += '.wave.two   { background-color:#fff;    animation-duration:9s; }\n';
  s.textContent += '.wave.three { background-color:#6cf;    animation-duration:12s; }\n';
  s.textContent += '@keyframes waves { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }\n';
  s.textContent += '.ice-aura { position:absolute; top:50%; left:50%; width:7em; height:7em; border-radius:50%; background:radial-gradient(circle,rgba(130,190,240,0.55) 0%,rgba(130,190,240,0.25) 45%,rgba(130,190,240,0.05) 70%,transparent 100%); animation:ice-pulse 2.5s ease-in-out infinite; z-index:0; }\n';
  s.textContent += '.wx-blizzard .ice-crystal { font-size:8em; color:#fff; text-shadow:none; z-index:1; }\n';
  s.textContent += '.wx-blizzard .ice-crystal::before, .wx-blizzard .ice-crystal::after { display:none; }\n';
  s.textContent += '@keyframes ice-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }\n';
  document.head.appendChild(s);
})();


// ═══════════════════════════════════════════════════════════════
// STAFF TASKS
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    F.utilities.waitFor(
        function() { return F.constants.JSONBIN_MASTER_KEY !== null; },
        function() {

    // ── CONFIG ──
    var SETTINGS = { binId:'699b6d2fd0ea881f40cff23d', tabId:1013, tabName:'Task Staff' };
    var API_KEY  = F.constants.JSONBIN_MASTER_KEY;
    var API_URL  = 'https://api.jsonbin.io/v3/b/' + SETTINGS.binId;

    if (!SETTINGS.binId || !API_KEY) return;
    if (!F.groups.isStaff() && !F.groups.isAdmin()) return;

    function isProfileStaff() {
        var pc=document.querySelector('div[class*="box_"]'); if(!pc)return false;
        var cls=' '+pc.className+' ';
        return cls.indexOf(' box_amministratore ')!==-1||cls.indexOf(' box_founder ')!==-1||cls.indexOf(' box_globalmod ')!==-1||cls.indexOf(' box_gruppo1 ')!==-1||cls.indexOf(' box_gruppo2 ')!==-1||cls.indexOf(' box_gruppo3 ')!==-1||cls.indexOf(' box_gruppo4 ')!==-1;
    }
    if (!isProfileStaff()) return;

    class StaffTasksTab {
        constructor() { this.currentUserId=null; this.currentUserName=Commons.user.nickname||'Sconosciuto'; this.tasks=[]; this.init(); }
        init() {
            if(!window.Commons||!window.Commons.location||!window.Commons.location.isProfile)return;
            this.currentUserId=parseInt(window.Commons.location.profile.id);
            if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>this.injectTab());}else{this.injectTab();}
        }
        getProfileUserName(){var el=document.querySelector('.profile .nick');return el?el.textContent.trim():'questo utente';}
        async loadTasks(){try{var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});if(!r.ok)throw new Error();var d=await r.json();this.tasks=(d.record.tasks||{})[this.currentUserId]||[];this.renderTasks();}catch(e){this.showError('Errore nel caricamento delle task');}}
        async saveTasks(all){try{var r=await fetch(API_URL,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':API_KEY},body:JSON.stringify({tasks:all})});if(!r.ok)throw new Error();return true;}catch(e){this.showError('Errore nel salvataggio');return false;}}
        async fetchAllTasks(){var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});var d=await r.json();return d.record.tasks||{};}
        async addTask(userId,taskTitle){try{var all=await this.fetchAllTasks();if(!all[userId])all[userId]=[];var t={id:'task_'+Date.now(),title:taskTitle,assignedBy:this.currentUserName,assignedById:String(Commons.user.id),assignedAt:new Date().toISOString(),completed:false,completedAt:null};all[userId].push(t);var saved=await this.saveTasks(all);if(saved){if(userId==this.currentUserId){this.tasks.push(t);this.renderTasks();}this.showSuccess('Task aggiunta!');}}catch(e){this.showError("Errore nell'aggiunta");}}
        async toggleTask(taskId){try{var all=await this.fetchAllTasks();var ut=all[this.currentUserId];if(!ut)return;for(var i=0;i<ut.length;i++){if(ut[i].id===taskId){ut[i].completed=!ut[i].completed;ut[i].completedAt=ut[i].completed?new Date().toISOString():null;break;}}var saved=await this.saveTasks(all);if(saved)await this.loadTasks();}catch(e){this.showError("Errore nell'aggiornamento");}}
        async deleteTask(taskId){try{var all=await this.fetchAllTasks();if(!all[this.currentUserId])return;all[this.currentUserId]=all[this.currentUserId].filter(function(t){return t.id!==taskId;});var saved=await this.saveTasks(all);if(saved)await this.loadTasks();}catch(e){this.showError("Errore nell'eliminazione");}}
        renderTasks(){
            var container=document.getElementById('staff-tasks-content');if(!container)return;
            var at=this.tasks.filter(function(t){return!t.completed;}),ct=this.tasks.filter(function(t){return t.completed;}),own=this.currentUserId==Commons.user.id;
            var html='<div class="tasks-section"><h4>Task Attive <span class="count">('+at.length+')</span></h4>'+(at.length===0?'<p class="empty">Nessuna task attiva</p>':'<ul class="tasks-list">'+at.map(t=>this.renderTask(t,own)).join('')+'</ul>')+'</div>';
            if(ct.length>0)html+='<div class="tasks-section completed-section"><h4>Task Completate <span class="count">('+ct.length+')</span></h4><ul class="tasks-list">'+ct.map(t=>this.renderTask(t,own)).join('')+'</ul></div>';
            container.innerHTML=html; this.attachEventListeners();
        }
        renderTask(task,own){
            var h='<li class="task-item '+(task.completed?'completed':'')+'" data-task-id="'+task.id+'">';
            if(own)h+='<input type="checkbox" class="task-checkbox" '+(task.completed?'checked':'')+' >';
            h+='<div class="task-content"><div class="task-title">'+this.escapeHtml(task.title)+'</div><div class="task-meta"><span class="task-assigned">Da: <strong>'+this.escapeHtml(task.assignedBy)+'</strong></span><span class="task-date">'+F.utilities.dates.formatDate(new Date(task.assignedAt),'D/M/Y H:I')+'</span></div></div>';
            if(own&&task.completed)h+='<button class="task-delete">&#10005;</button>';
            return h+'</li>';
        }
        attachEventListeners(){
            var self=this,own=this.currentUserId==Commons.user.id;if(!own)return;
            document.querySelectorAll('.task-checkbox').forEach(function(cb){cb.addEventListener('change',function(){self.toggleTask(this.closest('.task-item').getAttribute('data-task-id'));});});
            document.querySelectorAll('.task-delete').forEach(function(btn){btn.addEventListener('click',function(){var id=this.closest('.task-item').getAttribute('data-task-id');if(confirm('Eliminare questa task?'))self.deleteTask(id);});});
        }
        renderAddTaskForm(){
            var container=document.getElementById('staff-tasks-add');if(!container)return;
            var self=this;
            container.innerHTML='<div class="add-task-form"><h4>Aggiungi Task a '+this.getProfileUserName()+'</h4><input type="text" id="task-title-input" placeholder="Titolo della task..."/><button id="add-task-btn">Aggiungi Task</button></div>';
            var ab=document.getElementById('add-task-btn');
            ab.addEventListener('click',function(){var t=document.getElementById('task-title-input').value.trim();if(!t){alert('Inserisci un titolo');return;}self.addTask(self.currentUserId,t);document.getElementById('task-title-input').value='';});
            document.getElementById('task-title-input').addEventListener('keypress',function(e){if(e.key==='Enter')ab.dispatchEvent(new Event('click'));});
        }
        showMessage(msg,type){var c=document.getElementById('staff-tasks-message');if(!c)return;c.innerHTML='<div class="message '+type+'">'+msg+'</div>';setTimeout(function(){c.innerHTML='';},3000);}
        showError(m){this.showMessage(m,'error');}
        showSuccess(m){this.showMessage(m,'success');}
        escapeHtml(t){return t.replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];});}
        injectTab(){
            var tc=document.querySelector('.profile .tabs');
            if(tc)tc.insertAdjacentHTML('beforeend','<li id="t'+SETTINGS.tabId+'" class="Sub"><a href="#" onclick="javascript:tab('+SETTINGS.tabId+');return false" rel="nofollow">'+SETTINGS.tabName+'</a></li>');
            var ml=document.querySelector('.profile .main_list');
            if(ml)ml.insertAdjacentHTML('beforeend','<li id="tab'+SETTINGS.tabId+'" class="list nascosta"><div id="staff-tasks-container"><h3>Task Staff</h3><div id="staff-tasks-message"></div><div id="staff-tasks-content"><p class="loading">Caricamento...</p></div><div id="staff-tasks-add"></div></div></li>');
            this.loadTasks(); this.renderAddTaskForm();
        }
    }
    new StaffTasksTab();

    var style=document.createElement('style');
    style.textContent='#staff-tasks-container{padding:10px}#staff-tasks-container h3{margin:0 0 10px 0;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:8px;font-weight:bold}.tasks-section{margin-bottom:15px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.tasks-section.completed-section{border-left-color:#0b486b}.tasks-section h4{color:#0B486B;margin:0 0 8px 0;font-size:15px;font-weight:bold}.tasks-section h4 .count{color:#3B8686;font-weight:normal;font-size:13px}.tasks-list{list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto}.task-item{display:flex;align-items:flex-start;gap:8px;padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px;position:relative}.task-item.completed{opacity:0.6}.task-item.completed .task-title{text-decoration:line-through}.task-checkbox{width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px}.task-content{flex:1;min-width:0}.task-title{color:#292354;font-weight:600;font-size:14px;margin-bottom:4px;word-wrap:break-word}.task-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px}.task-assigned{color:#292354;background:#A8DBA8;padding:2px 6px;border-radius:3px}.task-date{color:#FFF;background:#3B8686;padding:2px 6px;border-radius:3px}.task-delete{position:absolute;top:8px;right:8px;background:#d9534f;color:#FFF;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0}.add-task-form{background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #79BD9A}.add-task-form h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.add-task-form input{width:100%;padding:8px;margin-bottom:8px;border:2px solid #3B8686;border-radius:5px;font-size:13px;box-sizing:border-box}.add-task-form button{width:100%;padding:10px;background:#3B8686;color:#FFF;border:none;border-radius:5px;font-size:14px;font-weight:bold;cursor:pointer}.message{padding:8px;border-radius:5px;margin-bottom:10px;text-align:center;font-weight:bold;font-size:12px}.message.error{background:#d9534f;color:#FFF}.message.success{background:#79BD9A;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:8px;font-size:13px}.loading{text-align:center;color:#0B486B;padding:15px;font-size:13px}';
    document.head.appendChild(style);

    }); // fine waitFor
})();


// ═══════════════════════════════════════════════════════════════
// TAB SCHEDE GDR
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    // ── CONFIG ──
    var SETTINGS = {
        tabId:   1012,
        tabName: 'Schede PG',
        sections: {
            attive:       { id: 65112407, label: 'Schede Attive' },
            nonApprovate: { id: 65112406, label: 'Schede Non Approvate' },
            congelate:    { id: 65112408, label: 'Schede Congelate' },
            inattive:     { id: 65112409, label: 'Schede Inattive' }
        }
    };

    function decodeHTML(text){var ta=document.createElement('textarea');ta.innerHTML=text;return ta.value;}

    class GDRSheetsTab {
        constructor(){this.currentProfileUserId=null;this.sheets={};for(var k in SETTINGS.sections){this.sheets[k]=[];}this.init();}
        init(){if(!window.Commons||!window.Commons.location||!window.Commons.location.isProfile)return;this.currentProfileUserId=parseInt(window.Commons.location.profile.id);if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>this.injectTab());}else{this.injectTab();}}
        loadTopicsFromAPI(sectionId){
            var all=[],perPage=100,page=0,self=this;
            function loadPage(){
                return fetch('https://'+location.hostname+'/api.php?f='+sectionId+'&a=2&n='+perPage+'&st='+(page*perPage)+'&cook'+'ie=1&_='+Date.now())
                    .then(function(r){if(!r.ok)throw new Error();return r.json();})
                    .then(function(data){
                        if(!data.threads||!data.threads.length)return all;
                        for(var i=0;i<data.threads.length;i++){var t=data.threads[i];if(!t.info||!t.info.start)continue;if(parseInt(t.info.start.id)!==self.currentProfileUserId)continue;all.push({id:parseInt(t.id),titolo:decodeHTML(t.title),url:'https://'+location.hostname+'/?t='+t.id,dataCreazione:new Date(t.info.start.date),dataUltimaModifica:new Date(t.info.last?t.info.last.date:t.info.start.date),autore:t.info.start.name});}
                        if(data.threads.length===perPage){page++;return loadPage();}
                        return all;
                    });
            }
            return loadPage();
        }
        async loadAllSheets(){
            var pe=document.getElementById('gdr-progress'),keys=Object.keys(SETTINGS.sections),total=keys.length,loaded=0;
            for(var key in SETTINGS.sections){var sec=SETTINGS.sections[key];if(pe)pe.innerHTML='Caricamento '+sec.label+'...';try{this.sheets[key]=await this.loadTopicsFromAPI(sec.id);}catch(e){this.sheets[key]=[];}loaded++;if(pe)pe.innerHTML='Caricamento... '+Math.round((loaded/total)*100)+'%';}
            if(pe)pe.style.display='none';this.renderSheets();
        }
        renderSheets(){
            var container=document.getElementById('gdr-custom-content');if(!container)return;
            var html='';
            for(var key in SETTINGS.sections){
                var sec=SETTINGS.sections[key],sheets=this.sheets[key];
                sheets.sort(function(a,b){return b.dataCreazione-a.dataCreazione;});
                html+='<div class="gdr-section"><h4>'+sec.label+' <span class="count">('+sheets.length+')</span></h4>';
                if(!sheets.length){html+='<p class="empty">Nessuna scheda</p>';}
                else{html+='<ul class="sheets-list">';for(var i=0;i<sheets.length;i++){var s=sheets[i];html+='<li><div class="sheet-info"><a href="'+s.url+'" class="sheet-title">'+s.titolo+'</a><div class="sheet-dates"><span class="date-created">Creata: '+F.utilities.dates.formatDate(s.dataCreazione,'D/M/Y H:I')+'</span><span class="date-modified">Ultima modifica: '+F.utilities.dates.formatDate(s.dataUltimaModifica,'D/M/Y H:I')+'</span></div></div></li>';}html+='</ul>';}
                html+='</div>';
            }
            container.innerHTML=html;
        }
        injectTab(){
            var tc=document.querySelector('.profile .tabs');
            if(tc)tc.insertAdjacentHTML('beforeend','<li id="t'+SETTINGS.tabId+'" class="Sub"><a href="#" onclick="javascript:tab('+SETTINGS.tabId+');return false" rel="nofollow">'+SETTINGS.tabName+'</a></li>');
            var ml=document.querySelector('.profile .main_list');
            if(ml)ml.insertAdjacentHTML('beforeend','<li id="tab'+SETTINGS.tabId+'" class="list nascosta"><div id="gdr-tab-content"><h3>Archivio Schede PG</h3><div id="gdr-progress" class="loading">Caricamento schede...</div><div id="gdr-custom-content"></div></div></li>');
            this.loadAllSheets();
        }
    }
    new GDRSheetsTab();

    var style=document.createElement('style');
    style.textContent='#gdr-tab-content{padding:15px}#gdr-tab-content h3{margin-bottom:15px;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:10px;font-weight:bold}.gdr-section{margin-bottom:30px;background:#E2F7C4;padding:15px;border-radius:8px;border-left:4px solid #3B8686}.gdr-section h4{color:#0B486B;margin-bottom:12px;font-size:17px;font-weight:bold}.gdr-section h4 .count{color:#3B8686;font-weight:normal;font-size:14px}.sheets-list{list-style:none;padding:0;margin:0}.sheets-list li{padding:12px;border-bottom:1px solid #CFF09E;background:#8FBEBA;margin-bottom:8px;border-radius:5px}.sheet-info{display:flex;flex-direction:column;gap:8px}.sheet-title{color:#292354;text-decoration:none;font-weight:600;font-size:15px}.sheet-dates{display:flex;gap:15px;flex-wrap:wrap}.sheet-dates span{font-size:12px;color:#292354;background:#A8DBA8;padding:3px 8px;border-radius:3px}.date-created{background:#79BD9A!important;color:#FFF}.date-modified{background:#3B8686!important;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:10px}.loading{text-align:center;color:#0B486B;padding:20px;font-size:14px}#gdr-progress{background:#3B8686;color:#FFF;padding:10px;border-radius:5px;margin-bottom:15px;text-align:center;font-weight:bold}';
    document.head.appendChild(style);
})();


})(); // fine IIFE globale
