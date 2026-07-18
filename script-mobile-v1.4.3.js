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

// ── LOGO SKIN: crea e popola logonataleffm e logohalloweenffm ──
;(function() {
    var logo = document.querySelector('.logo');
    if (!logo) return;

    var imagesNatale    = ['https://upload.forumfree.net/i/ff13982804/Hunter/LogoChrollo.png','https://upload.forumfree.net/i/ff13982804/Hunter/LogoGon2.png','https://upload.forumfree.net/i/ff13982804/Hunter/LogoHisoka.png'];
    var imagesHalloween = ['https://upload.forumfree.net/i/ff13982804/LogoROMANCE2.png','https://upload.forumfree.net/i/ff13982804/LogoROMANCE2.png','https://upload.forumfree.net/i/ff13982804/LogoROMANCE2.png'];

    function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function makeLogoEl(cls, images) {
        var a = document.createElement('a');
        a.className = cls;
        a.href = logo.href || '/';
        a.style.backgroundImage = 'url(https://img.forumfree.net/index_file/spacer.gif)';
        var inner = document.createElement('div');
        inner.innerHTML = '<img src="' + pickRandom(images) + '">';
        a.appendChild(inner);
        return a;
    }

    var nat = makeLogoEl('logonataleffm', imagesNatale);
    var hal = makeLogoEl('logohalloweenffm', imagesHalloween);
    logo.parentNode.insertBefore(nat, logo.nextSibling);
    logo.parentNode.insertBefore(hal, logo.nextSibling);
})();

// ── UTILITY: riprova l'iniezione fino a maxAttempts volte ogni 500ms ──
function injectWithRetry(fn, checkId, maxAttempts) {
    var attempts = 0;
    function tryInject() {
        if (document.getElementById(checkId)) return; // già presente
        fn();
        attempts++;
        if (attempts < maxAttempts) setTimeout(tryInject, 500);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 100); });
    } else {
        setTimeout(tryInject, 100);
    }
}


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

function isHome()       { return document.body.id === 'board'; }
function isTopic()      { return document.body.id === 'topic'; }
function isSection()    { return document.body.id === 'forum'; }
function getTopicId()   { var m = location.search.match(/[?&]t=(\d+)/); return m ? m[1] : null; }
function getSectionId() { var m = location.search.match(/[?&]f=(\d+)/); return m ? m[1] : null; }
window.HxHFramework.location = { isHome: isHome, isTopic: isTopic, isSection: isSection, getTopicId: getTopicId, getSectionId: getSectionId };

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

function formatDate(date, template) {
    date = date || new Date(); template = template || 'D/M/Y';
    var pad = function(n) { return n < 10 ? '0'+n : ''+n; };
    return template.replace('D',pad(date.getDate())).replace('M',pad(date.getMonth()+1)).replace('Y',date.getFullYear())
                   .replace('H',pad(date.getHours())).replace('I',pad(date.getMinutes())).replace('S',pad(date.getSeconds()));
}
function isSameDay(day) { var t=new Date(),c=new Date(day); return t.getDate()===c.getDate()&&t.getMonth()===c.getMonth()&&t.getFullYear()===c.getFullYear(); }
function isNewDay(key) { var today=formatDate(new Date(),'D/M/Y'),last=localStorage.getItem(key); if(last!==today){localStorage.setItem(key,today);return true;} return false; }
window.HxHFramework.utilities.dates = { formatDate: formatDate, isSameDay: isSameDay, isNewDay: isNewDay };

function getURLParameter(url, parameter) { var m=new RegExp('[?&]'+parameter+'=([^&#]*)').exec(url); return m?decodeURIComponent(m[1]):null; }
function JSONtoString(json)   { try{return JSON.stringify(json);}catch(e){return '';} }
function StringToJSON(string) { try{return JSON.parse(string);}catch(e){return null;} }
window.HxHFramework.utilities.string = { getURLParameter: getURLParameter, JSONtoString: JSONtoString, StringToJSON: StringToJSON };

function storageSet(key,value) { try{localStorage.setItem(key,typeof value==='object'?JSONtoString(value):value);}catch(e){} }
function storageGet(key,parseJSON) { var v=localStorage.getItem(key); if(v===null)return null; return parseJSON?StringToJSON(v):v; }
function storageRemove(key) { localStorage.removeItem(key); }
function storageExists(key) { return localStorage.getItem(key)!==null; }
window.HxHFramework.utilities.storage = { set: storageSet, get: storageGet, remove: storageRemove, exists: storageExists };

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
        if (document.getElementById('echo-slider')) return true;
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
        if (document.getElementById('echo-slider')) return;
        function init(){if(!echoCreateSlider())return;echoLoadTopics(function(){echoStartSlider();});}
        if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{setTimeout(init,100);}
    }
    echoInitSlider();
})();


// ═══════════════════════════════════════════════════════════════
// SKIN ALTERNATIVE
// ═══════════════════════════════════════════════════════════════

;(function() {
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

    // ── injectWithRetry: riprova fino a 20 volte ogni 500ms ──
    injectWithRetry(function() {
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
    }, 'skin-addon-box', 20);
})();


// ═══════════════════════════════════════════════════════════════
// TEAMZONE PATCH
// ═══════════════════════════════════════════════════════════════

;(function() {
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
    var SETTINGS = { sez: 65073571, topic: 81025561, toast_duration: 8000 };
    var FB_URL = 'https://compleanni-4035c-default-rtdb.europe-west1.firebasedatabase.app/birthdays-done';

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // Legge il nodo Firebase: se la data è diversa da oggi lo cancella e restituisce false
    // Se la data è oggi controlla se l'utente corrente ha già fatto gli auguri
    async function checkDone(userId) {
        try {
            var r = await fetch(FB_URL + '.json');
            var data = await r.json();
            if (!data) return false;
            if (data.date !== todayKey()) {
                // Giorno nuovo: cancella il nodo
                await fetch(FB_URL + '.json', { method: 'DELETE' });
                return false;
            }
            return !!(data.users && data.users[userId]);
        } catch(e) { return false; }
    }

    // Scrive l'utente nel nodo Firebase per oggi
    async function markDone(userId) {
        try {
            // Prima leggi il nodo attuale per non sovrascrivere altri utenti
            var r = await fetch(FB_URL + '.json');
            var data = await r.json() || {};
            if (data.date !== todayKey()) data = { date: todayKey(), users: {} };
            if (!data.users) data.users = {};
            data.users[userId] = true;
            await fetch(FB_URL + '.json', { method: 'PUT', body: JSON.stringify(data) });
        } catch(e) {}
    }

    window.addEventListener('load', function() {
        if (!F.location.isHome() || F.groups.isGuest()) return;
        F.requests.fetchToken(function(token) {
            var today = new Date().toDateString(), BIRTHDAYS = [];
            var container = document.querySelector('#birthdays');
            if (container) { var links = container.querySelectorAll('.submenu a'); for(var i=0;i<links.length;i++){var a=links.item(i),href=a.getAttribute('href')||'',m=href.match(/MID=(\d+)/);BIRTHDAYS.push({id:m?m[1]:null,nickname:a.textContent.trim(),url:href});} }
            if (!BIRTHDAYS.length) return;
            for (var i=0;i<BIRTHDAYS.length;i++){if(BIRTHDAYS[i].id==Commons.user.id)return;}
            injectFA(); injectStyles();

            var userId = String(Commons.user.id);

            checkDone(userId).then(function(done) {
                if (done) return; // già fatto oggi su qualsiasi device
                if (ST.get('bgr-lastcheck') === today) { showBubble(BIRTHDAYS); return; }
                ST.set('bgr-lastcheck', today);
                showCard(BIRTHDAYS);
            });

            function postWish(birthdays, callback) {
                var tags=''; for(var i=0;i<birthdays.length;i++){if(i>0)tags+=', ';tags+='<mark data-uid="'+birthdays[i].id+'">'+birthdays[i].nickname+'</mark>';}
                var msg='<div style="background:linear-gradient(135deg,#1a1040 0%,#0d3b52 100%);border-radius:16px;padding:28px;font-family:Montserrat,sans-serif;">'
                    +'<div style="text-align:center;margin-bottom:20px;"><div style="font-size:36px;color:#79BD9A;"><i class="fa fa-birthday-cake"></i></div>'
                    +'<div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#79BD9A,#CFF09E,#79BD9A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Buon Compleanno!</div></div>'
                    +'<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:16px;text-align:center;margin-bottom:18px;">'
                    +'<p style="font-size:14px;color:#8FBEBA;margin:0;">Tanti auguri a '+tags+' da parte di tutti noi di <strong style="color:#E2F7C4;">'+F.constants.FORUM_NAME+'</strong>!</p></div>'
                    +'<div style="text-align:center;border-top:1px solid rgba(143,190,186,.15);padding-top:14px;"><span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(143,190,186,.5);">'+F.constants.FORUM_NAME+'</span></div></div>';
                F.requests.postComment(token, SETTINGS.sez, SETTINGS.topic, msg, function(ok) { callback(ok); });
            }
            function showCard(b){renderCard(b,true);}
            function showCardFromBubble(b){renderCard(b,false);}
            function renderCard(birthdays, autoDismiss) {
                var nl=buildNamesList(birthdays), verb=birthdays.length===1?'compie gli anni oggi!':'compiono gli anni oggi!';
                document.body.insertAdjacentHTML('beforeend','<div id="bgr-card"><button class="bgr-close"><i class="fa fa-times"></i></button><div class="bgr-icon"><i class="fa fa-birthday-cake"></i></div><div class="bgr-body"><p class="bgr-title">Compleanni di oggi!</p><p class="bgr-subtitle">'+nl+' '+verb+'</p><button class="bgr-btn" id="bgr-wish-btn"><i class="fa fa-heart"></i> Fai gli auguri!</button></div></div>');
                var card=document.getElementById('bgr-card'), wb=document.getElementById('bgr-wish-btn'), cb=card.querySelector('.bgr-close');
                wb.addEventListener('click', function() {
                    wb.disabled=true; wb.innerHTML='<i class="fa fa-spinner fa-spin"></i> Invio...';
                    postWish(birthdays, function() {
                        markDone(userId).then(function() {
                            setTimeout(function(){ document['loca'+'tion']['hre'+'f']='https://'+location.hostname+'/?t='+SETTINGS.topic+'#newpost'; }, 2000);
                        });
                    });
                });
                if(autoDismiss){cb.addEventListener('click',function(){minimizeToBubble(card,birthdays);});setTimeout(function(){minimizeToBubble(card,birthdays);},SETTINGS.toast_duration);}
                else{cb.addEventListener('click',function(){if(card.parentNode)card.parentNode.removeChild(card);showBubble(birthdays);});}
            }
            function minimizeToBubble(card,birthdays){if(!card||card._minimizing)return;card._minimizing=true;card.style.animation='bgr-shrink .4s forwards';setTimeout(function(){if(card.parentNode)card.parentNode.removeChild(card);showBubble(birthdays);},400);}
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

// ── METEO: crea #hxh-bar e lo inserisce in #ff_links con injectWithRetry ──
;(function() {
    var bar = document.createElement('div');
    bar.id  = 'hxh-bar';

    injectWithRetry(function() {
        var ffLinks = document.querySelector('#ff_links');
        if (!ffLinks) return;
        var container = document.createElement('div');
        container.id = 'hxh-meteo-box';
        container.appendChild(bar);
        ffLinks.appendChild(container);
        hxhStart();
    }, 'hxh-meteo-box', 20);
})();

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
  else if (cls === "wx-meteor") {
    var scene = mk("div", "meteor-scene");
    var mThird = mk("div", "m-third");
    var ul3 = document.createElement("ul");
    for (var mi = 0; mi < 2; mi++) ul3.appendChild(document.createElement("li"));
    var f1a = document.createElement("li"); f1a.className = "floating-1"; ul3.appendChild(f1a);
    var f1b = document.createElement("li"); f1b.className = "floating-1"; ul3.appendChild(f1b);
    var f2a = document.createElement("li"); f2a.className = "floating-2"; ul3.appendChild(f2a);
    var f2b = document.createElement("li"); f2b.className = "floating-2"; ul3.appendChild(f2b);
    mThird.appendChild(ul3); scene.appendChild(mThird);
    var mFourth = mk("div", "m-fourth");
    var ul4 = document.createElement("ul");
    for (var mj = 0; mj < 7; mj++) ul4.appendChild(document.createElement("li"));
    for (var mk2 = 0; mk2 < 4; mk2++) { var mfl = document.createElement("li"); mfl.className = "m-floating"; ul4.appendChild(mfl); }
    mFourth.appendChild(ul4); scene.appendChild(mFourth);
    wrap.appendChild(scene);
  }
  else if (cls === "wx-tsunami")  { var ww = mk("div", "wave-wrapper"); ww.appendChild(mk("div", "wave one")); ww.appendChild(mk("div", "wave two")); ww.appendChild(mk("div", "wave three")); wrap.appendChild(ww); }
  else if (cls === "wx-heatwave") {
    wrap.appendChild(mk("div", "heat-sun"));
    var cactus = mk("div", "cactus");
    var ns4 = "http://www.w3.org/2000/svg";
    var csvg = document.createElementNS(ns4, "svg");
    csvg.setAttribute("viewBox", "0 0 40 48"); csvg.setAttribute("width", "40"); csvg.setAttribute("height", "48"); csvg.setAttribute("fill", "none");
    ["M16 44 L16 18 Q16 14 20 14 Q24 14 24 18 L24 44 Z","M 8.5 16 Q 6 16 6 18.5 L 6 32 L 16 32 L 16 27 L 11 27 L 11 18.5 Q 11 16 8.5 16 Z","M 31.5 20 Q 34 20 34 22.5 L 34 36 L 24 36 L 24 31 L 29 31 L 29 22.5 Q 29 20 31.5 20 Z"].forEach(function(d) {
      var p = document.createElementNS(ns4, "path"); p.setAttribute("d", d); p.setAttribute("fill", "#fff"); csvg.appendChild(p);
    });
    cactus.appendChild(csvg); wrap.appendChild(cactus);
  }
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
  s.textContent += '.meteor-scene { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); width:18px; height:15px; }\n';
  s.textContent += '.meteor-scene > div { border-radius:100px 0 0 100px; transform:translate(-50%,-50%); left:50%; top:50%; position:absolute; }\n';
  s.textContent += '.meteor-scene > div ul { margin:0; padding:0; }\n';
  s.textContent += '.meteor-scene > div ul li { list-style:none; display:block; }\n';
  s.textContent += '.m-third { background-color:#f93; height:18px; width:18px; margin-left:-2px; box-shadow:0 0 4px #f93; }\n';
  s.textContent += '.m-third li { border-radius:300px; position:relative; left:0; }\n';
  s.textContent += '.m-third li:nth-child(1) { width:10px; height:2px; background:#f93; margin-left:9px; animation:m-anim1 1s ease infinite; }\n';
  s.textContent += '.m-third li:nth-child(2) { width:16px; height:2px; background:#f93; margin-left:9px; margin-top:14px; animation:m-anim1 1s ease infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-third li.floating-1 { position:absolute; top:0; height:2px; box-shadow:0 0 2px #f93; background:#f93; }\n';
  s.textContent += '.m-third li.floating-2 { position:absolute; bottom:0; height:2px; background:#f93; }\n';
  s.textContent += '.m-third li:nth-child(3) { width:7px; left:11px; animation:m-f1 2s ease-out infinite; }\n';
  s.textContent += '.m-third li:nth-child(4) { width:3px; left:20px; animation:m-f11 1.8s ease-out infinite; }\n';
  s.textContent += '.m-third li:nth-child(5) { width:5px; left:0; animation:m-f11 1s ease-out infinite; animation-delay:0.3s; }\n';
  s.textContent += '.m-third li:nth-child(6) { width:2px; left:0; animation:m-f11 1.5s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-fourth { width:15px; height:15px; margin-left:-2px; background:#fff; box-shadow:0 0 4px #fff; }\n';
  s.textContent += '.m-fourth li { position:relative; border-radius:200px; }\n';
  s.textContent += '.m-fourth li:nth-child(1) { width:16px; height:2px; background:#fff; left:9px; box-shadow:0 0 2px #fff; animation:m-anim2 1.5s ease-out infinite; }\n';
  s.textContent += '.m-fourth li:nth-child(2) { background:radial-gradient(circle at 100% 50%,rgba(204,0,0,0) 1px,#fff 2px); width:13px; height:2px; margin-left:9px; animation:m-anim3 1.6s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(3) { width:19px; height:2px; background:#fff; left:8px; box-shadow:0 0 2px #fff; animation:m-anim2 1.2s ease-out infinite; animation-delay:1s; }\n';
  s.textContent += '.m-fourth li:nth-child(4) { background:radial-gradient(circle at 100% 50%,rgba(204,0,0,0) 1px,#fff 2px); width:12px; height:2px; margin-left:13px; animation:m-anim3 2s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(5) { width:15px; height:2px; background:#fff; left:10px; box-shadow:0 0 2px #fff; animation:m-anim4 2s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(6) { background:radial-gradient(circle at 100% 50%,rgba(204,0,0,0) 1px,#fff 2px); width:12px; height:2px; margin-left:13px; animation:m-anim3 1s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(7) { width:17px; height:2px; background:#fff; left:9px; box-shadow:0 0 2px #fff; animation:m-anim2 1.3s ease-out infinite; animation-delay:0.5s; }\n';
  s.textContent += '.m-floating { position:absolute; background:#fff; border-radius:100px; box-shadow:0 0 2px #85EDE8; z-index:-2; opacity:0; }\n';
  s.textContent += '.m-fourth li:nth-child(8)  { width:2px; height:2px; top:-13px; left:9px; animation:m-float1 3s ease infinite; animation-delay:0.4s; }\n';
  s.textContent += '.m-fourth li:nth-child(9)  { width:2px; height:2px; top:-9px; animation:m-float2 3s ease infinite; animation-delay:2.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(10) { width:2px; height:2px; top:-9px; left:9px; animation:m-float3 3s ease infinite; animation-delay:1.5s; }\n';
  s.textContent += '.m-fourth li:nth-child(11) { width:2px; height:2px; top:-13px; left:9px; animation:m-float4 3s ease infinite; animation-delay:1.5s; }\n';
  s.textContent += '@keyframes m-anim1  { 0%{left:0} 50%{left:5px} 100%{left:0} }\n';
  s.textContent += '@keyframes m-anim2  { 0%{left:8px} 50%{left:12px} 100%{left:8px} }\n';
  s.textContent += '@keyframes m-anim3  { 0%{left:0} 50%{left:1px} 100%{left:0} }\n';
  s.textContent += '@keyframes m-anim4  { 0%{left:10px} 50%{left:15px} 100%{left:10px} }\n';
  s.textContent += '@keyframes m-f1   { 0%{left:2px;width:13px} 50%{left:28px;opacity:0.5;width:9px} 60%{left:28px;opacity:0;width:1px} 100%{left:2px;opacity:0;width:0} }\n';
  s.textContent += '@keyframes m-f11  { 0%{left:11px} 50%{left:34px;opacity:0.5} 60%{opacity:0;left:34px} 100%{left:11px;opacity:0} }\n';
  s.textContent += '@keyframes m-float1 { 0%{left:9px;opacity:0} 50%{left:29px;opacity:1} 70%{left:29px;opacity:0} 100%{left:9px;opacity:0} }\n';
  s.textContent += '@keyframes m-float2 { 0%{left:10px;opacity:0} 50%{left:32px;opacity:1} 70%{left:32px;opacity:0} 100%{left:10px;opacity:0} }\n';
  s.textContent += '@keyframes m-float3 { 0%{left:9px;opacity:0} 50%{left:29px;opacity:1} 70%{left:29px;opacity:0} 100%{left:9px;opacity:0} }\n';
  s.textContent += '@keyframes m-float4 { 0%{left:9px;opacity:0} 50%{left:33px;opacity:1} 70%{left:33px;opacity:0} 100%{left:9px;opacity:0} }\n';
  s.textContent += '.wave-wrapper { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:7em; height:7em; overflow:hidden; border-radius:50%; background-color:transparent; }\n';
  s.textContent += '.wave { position:absolute; top:42%; left:-50%; width:14em; height:14em; border-radius:25%; animation:waves linear infinite; }\n';
  s.textContent += '.wave.one   { background-color:#3a6aaa; animation-duration:7s; }\n';
  s.textContent += '.wave.two   { background-color:#fff;    animation-duration:9s; }\n';
  s.textContent += '.wave.three { background-color:#6cf;    animation-duration:12s; }\n';
  s.textContent += '@keyframes waves { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }\n';
  s.textContent += '.wx-heatwave .heat-sun { position:absolute; top:38%; left:60%; width:3.2em; height:3.2em; margin:-1.6em -1.6em; background:#f93; border-radius:50%; box-shadow:0 0 0 0.375em #fff; animation:wx-hot-pulse 2.5s ease-in-out infinite; z-index:0; }\n';
  s.textContent += '.wx-heatwave .cactus { position:absolute; top:50%; left:25%; transform:translate(-50%,-44%); z-index:1; }\n';
  s.textContent += '.ice-aura { position:absolute; top:50%; left:50%; width:7em; height:7em; border-radius:50%; background:radial-gradient(circle,rgba(130,190,240,0.55) 0%,rgba(130,190,240,0.25) 45%,rgba(130,190,240,0.05) 70%,transparent 100%); animation:ice-pulse 2.5s ease-in-out infinite; z-index:0; }\n';
  s.textContent += '.wx-blizzard .ice-crystal { font-size:8em; color:#fff; text-shadow:none; z-index:1; }\n';
  s.textContent += '.wx-blizzard .ice-crystal::before, .wx-blizzard .ice-crystal::after { display:none; }\n';
  s.textContent += '@keyframes ice-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }\n';
  document.head.appendChild(s);
})();


// ═══════════════════════════════════════════════════════════════
// STAFF TASKS — mobile: inietta come <li> nella lista profilo
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    F.utilities.waitFor(
        function() { return F.constants.JSONBIN_MASTER_KEY !== null; },
        function() {

    var SETTINGS = { binId:'699b6d2fd0ea881f40cff23d', sectionName:'Task Staff' };
    var API_KEY  = F.constants.JSONBIN_MASTER_KEY;
    var API_URL  = 'https://api.jsonbin.io/v3/b/' + SETTINGS.binId;

    if (!SETTINGS.binId || !API_KEY) return;
    if (!F.groups.isStaff() && !F.groups.isAdmin()) return;
    if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return;

    function isProfileStaff() {
        var pc=document.querySelector('ul.list-group.profile'); if(!pc)return false;
        var cls=' '+pc.className+' ';
        return cls.indexOf(' box_amministratore ')!==-1||cls.indexOf(' box_founder ')!==-1||cls.indexOf(' box_globalmod ')!==-1||cls.indexOf(' box_gruppo1 ')!==-1||cls.indexOf(' box_gruppo2 ')!==-1||cls.indexOf(' box_gruppo3 ')!==-1||cls.indexOf(' box_gruppo4 ')!==-1;
    }
    if (!isProfileStaff()) return;

    var currentUserId = parseInt(window.Commons.location.profile.id);
    var currentUserName = Commons.user.nickname || 'Sconosciuto';
    var tasks = [];

    // ── Inserisce i due <li> nella lista profilo prima di .bottom ──
    function injectProfileSection() {
        if (document.getElementById('staff-tasks-content')) return;
        var uInfo = document.querySelector('.list-group.profile .u_info');
        if (!uInfo) return;
        var anchor = uInfo.nextSibling;
        var titleLi = document.createElement('li');
        titleLi.className = 'title';
        titleLi.textContent = SETTINGS.sectionName;
        var contentLi = document.createElement('li');
        contentLi.className = 'u_tasks';
        contentLi.innerHTML = '<div id="staff-tasks-message"></div><div id="staff-tasks-content"><p class="st-loading">Caricamento...</p></div><div id="staff-tasks-add"></div>';
        uInfo.parentNode.insertBefore(titleLi, anchor);
        uInfo.parentNode.insertBefore(contentLi, anchor);
        loadTasks();
        renderAddTaskForm();
    }

    function getProfileUserName(){var el=document.querySelector('.u_nick');return el?el.textContent.trim():'questo utente';}

    async function loadTasks(){try{var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});if(!r.ok)throw new Error();var d=await r.json();tasks=(d.record.tasks||{})[currentUserId]||[];renderTasks();}catch(e){showError('Errore nel caricamento delle task');}}
    async function saveTasks(all){try{var r=await fetch(API_URL,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':API_KEY},body:JSON.stringify({tasks:all})});if(!r.ok)throw new Error();return true;}catch(e){showError('Errore nel salvataggio');return false;}}
    async function fetchAllTasks(){var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});var d=await r.json();return d.record.tasks||{};}
    async function addTask(taskTitle){try{var all=await fetchAllTasks();if(!all[currentUserId])all[currentUserId]=[];var t={id:'task_'+Date.now(),title:taskTitle,assignedBy:currentUserName,assignedById:String(Commons.user.id),assignedAt:new Date().toISOString(),completed:false,completedAt:null};all[currentUserId].push(t);var saved=await saveTasks(all);if(saved){tasks.push(t);renderTasks();showSuccess('Task aggiunta!');}}catch(e){showError("Errore nell'aggiunta");}}
    async function toggleTask(taskId){try{var all=await fetchAllTasks();var ut=all[currentUserId];if(!ut)return;for(var i=0;i<ut.length;i++){if(ut[i].id===taskId){ut[i].completed=!ut[i].completed;ut[i].completedAt=ut[i].completed?new Date().toISOString():null;break;}}var saved=await saveTasks(all);if(saved)await loadTasks();}catch(e){showError("Errore nell'aggiornamento");}}
    async function deleteTask(taskId){try{var all=await fetchAllTasks();if(!all[currentUserId])return;all[currentUserId]=all[currentUserId].filter(function(t){return t.id!==taskId;});var saved=await saveTasks(all);if(saved)await loadTasks();}catch(e){showError("Errore nell'eliminazione");}}

    function escapeHtml(t){return t.replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];});}

    function renderTasks(){
        var container=document.getElementById('staff-tasks-content'); if(!container)return;
        var own = currentUserId == Commons.user.id;
        var at=tasks.filter(function(t){return!t.completed;}), ct=tasks.filter(function(t){return t.completed;});
        var html='<div class="tasks-section"><h4>Task Attive <span class="count">('+at.length+')</span></h4>'+(at.length===0?'<p class="st-empty">Nessuna task attiva</p>':'<ul class="tasks-list">'+at.map(function(t){return renderTask(t,own);}).join('')+'</ul>')+'</div>';
        if(ct.length>0)html+='<div class="tasks-section completed-section"><h4>Task Completate <span class="count">('+ct.length+')</span></h4><ul class="tasks-list">'+ct.map(function(t){return renderTask(t,own);}).join('')+'</ul></div>';
        container.innerHTML=html;
        attachEventListeners(own);
    }
    function renderTask(task,own){
        var h='<li class="task-item '+(task.completed?'completed':'')+'" data-task-id="'+task.id+'">';
        if(own)h+='<input type="checkbox" class="task-checkbox" '+(task.completed?'checked':'')+' >';
        h+='<div class="task-content"><div class="task-title">'+escapeHtml(task.title)+'</div><div class="task-meta"><span class="task-assigned">Da: <strong>'+escapeHtml(task.assignedBy)+'</strong></span><span class="task-date">'+F.utilities.dates.formatDate(new Date(task.assignedAt),'D/M/Y H:I')+'</span></div></div>';
        if(own&&task.completed)h+='<button class="task-delete">&#10005;</button>';
        return h+'</li>';
    }
    function attachEventListeners(own){
        if(!own)return;
        document.querySelectorAll('.task-checkbox').forEach(function(cb){cb.addEventListener('change',function(){toggleTask(this.closest('.task-item').getAttribute('data-task-id'));});});
        document.querySelectorAll('.task-delete').forEach(function(btn){btn.addEventListener('click',function(){var id=this.closest('.task-item').getAttribute('data-task-id');if(confirm('Eliminare questa task?'))deleteTask(id);});});
    }
    function renderAddTaskForm(){
        var container=document.getElementById('staff-tasks-add'); if(!container)return;
        container.innerHTML='<div class="add-task-form"><h4>Aggiungi Task a '+getProfileUserName()+'</h4><input type="text" id="task-title-input" placeholder="Titolo della task..."><button id="add-task-btn">Aggiungi</button></div>';
        var ab=document.getElementById('add-task-btn');
        ab.addEventListener('click',function(){var t=document.getElementById('task-title-input').value.trim();if(!t){alert('Inserisci un titolo');return;}addTask(t);document.getElementById('task-title-input').value='';});
        document.getElementById('task-title-input').addEventListener('keypress',function(e){if(e.key==='Enter')ab.click();});
    }
    function showMessage(msg,type){var c=document.getElementById('staff-tasks-message');if(!c)return;c.innerHTML='<div class="st-message '+type+'">'+msg+'</div>';setTimeout(function(){c.innerHTML='';},3000);}
    function showError(m){showMessage(m,'error');}
    function showSuccess(m){showMessage(m,'success');}

    injectWithRetry(injectProfileSection, 'staff-tasks-content', 20);

    var style=document.createElement('style');
    style.textContent='.u_tasks{padding:10px}.tasks-section{margin-bottom:12px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.tasks-section.completed-section{border-left-color:#0b486b}.tasks-section h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.tasks-section h4 .count{color:#3B8686;font-weight:normal;font-size:12px}.tasks-list{list-style:none;padding:0;margin:0;overflow-y:auto;max-height:140px}.task-item{display:flex;align-items:flex-start;gap:8px;padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px;position:relative}.task-item.completed{opacity:0.6}.task-item.completed .task-title{text-decoration:line-through}.task-checkbox{width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px}.task-content{flex:1;min-width:0}.task-title{color:#292354;font-weight:600;font-size:13px;margin-bottom:3px;word-wrap:break-word}.task-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:10px}.task-assigned{color:#292354;background:#A8DBA8;padding:2px 5px;border-radius:3px}.task-date{color:#FFF;background:#3B8686;padding:2px 5px;border-radius:3px}.task-delete{position:absolute;top:6px;right:6px;background:#d9534f;color:#FFF;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;line-height:1;padding:0}.add-task-form{background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #79BD9A;margin-top:8px}.add-task-form h4{color:#0B486B;margin:0 0 8px 0;font-size:13px;font-weight:bold}.add-task-form input{width:100%;padding:8px;margin-bottom:8px;border:2px solid #3B8686;border-radius:5px;font-size:13px;box-sizing:border-box}.add-task-form button{width:100%;padding:9px;background:#3B8686;color:#FFF;border:none;border-radius:5px;font-size:13px;font-weight:bold;cursor:pointer}.st-message{padding:7px;border-radius:5px;margin-bottom:8px;text-align:center;font-weight:bold;font-size:12px}.st-message.error{background:#d9534f;color:#FFF}.st-message.success{background:#79BD9A;color:#FFF}.st-empty{color:#3B8686;font-style:italic;padding:6px;font-size:12px}.st-loading{text-align:center;color:#0B486B;padding:12px;font-size:13px}';
    document.head.appendChild(style);

    }); // fine waitFor
})();


// ═══════════════════════════════════════════════════════════════
// SCHEDE GDR — mobile: inietta come <li> nella lista profilo
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return;

    var SETTINGS = {
        sectionName: 'Schede PG',
        sections: {
            attive:       { id: 65112407, label: 'Schede Attive' },
            nonApprovate: { id: 65112406, label: 'Schede Non Approvate' },
            congelate:    { id: 65112408, label: 'Schede Congelate' },
            inattive:     { id: 65112409, label: 'Schede Inattive' }
        }
    };

    var currentProfileUserId = parseInt(window.Commons.location.profile.id);
    var sheets = {};
    for (var k in SETTINGS.sections) sheets[k] = [];

    function decodeHTML(text){var ta=document.createElement('textarea');ta.innerHTML=text;return ta.value;}

    function injectProfileSection() {
        if (document.getElementById('gdr-custom-content')) return;
        var uInfo = document.querySelector('.list-group.profile .u_info');
        if (!uInfo) return;
        var anchor = uInfo.nextSibling;
        var titleLi = document.createElement('li');
        titleLi.className = 'title';
        titleLi.textContent = SETTINGS.sectionName;
        var contentLi = document.createElement('li');
        contentLi.className = 'u_sheets';
        contentLi.innerHTML = '<div id="gdr-progress" class="gdr-loading">Caricamento schede...</div><div id="gdr-custom-content"></div>';
        uInfo.parentNode.insertBefore(titleLi, anchor);
        uInfo.parentNode.insertBefore(contentLi, anchor);
        loadAllSheets();
    }

    function loadTopicsFromAPI(sectionId) {
        var all=[],perPage=100,page=0;
        function loadPage(){
            return fetch('https://'+location.hostname+'/api.php?f='+sectionId+'&a=2&n='+perPage+'&st='+(page*perPage)+'&cook'+'ie=1&_='+Date.now())
                .then(function(r){if(!r.ok)throw new Error();return r.json();})
                .then(function(data){
                    if(!data.threads||!data.threads.length)return all;
                    for(var i=0;i<data.threads.length;i++){var t=data.threads[i];if(!t.info||!t.info.start)continue;if(parseInt(t.info.start.id)!==currentProfileUserId)continue;all.push({id:parseInt(t.id),titolo:decodeHTML(t.title),url:'https://'+location.hostname+'/?t='+t.id,dataCreazione:new Date(t.info.start.date),dataUltimaModifica:new Date(t.info.last?t.info.last.date:t.info.start.date)});}
                    if(data.threads.length===perPage){page++;return loadPage();}
                    return all;
                });
        }
        return loadPage();
    }

    async function loadAllSheets(){
        var pe=document.getElementById('gdr-progress');
        var keys=Object.keys(SETTINGS.sections), total=keys.length, loaded=0;
        for(var key in SETTINGS.sections){
            var sec=SETTINGS.sections[key];
            if(pe)pe.textContent='Caricamento '+sec.label+'...';
            try{sheets[key]=await loadTopicsFromAPI(sec.id);}catch(e){sheets[key]=[];}
            loaded++;
            if(pe)pe.textContent='Caricamento... '+Math.round((loaded/total)*100)+'%';
        }
        if(pe)pe.style.display='none';
        renderSheets();
    }

    function renderSheets(){
        var container=document.getElementById('gdr-custom-content'); if(!container)return;
        var html='';
        for(var key in SETTINGS.sections){
            var sec=SETTINGS.sections[key], list=sheets[key];
            list.sort(function(a,b){return b.dataCreazione-a.dataCreazione;});
            html+='<div class="gdr-section"><h4>'+sec.label+' <span class="gdr-count">('+list.length+')</span></h4>';
            if(!list.length){html+='<p class="gdr-empty">Nessuna scheda</p>';}
            else{html+='<ul class="gdr-sheets-list">';for(var i=0;i<list.length;i++){var s=list[i];html+='<li><a href="'+s.url+'" class="gdr-sheet-title">'+s.titolo+'</a><div class="gdr-sheet-dates"><span class="gdr-date-created">'+F.utilities.dates.formatDate(s.dataCreazione,'D/M/Y H:I')+'</span><span class="gdr-date-modified">'+F.utilities.dates.formatDate(s.dataUltimaModifica,'D/M/Y H:I')+'</span></div></li>';}html+='</ul>';}
            html+='</div>';
        }
        container.innerHTML=html;
    }

    injectWithRetry(injectProfileSection, 'gdr-custom-content', 20);

    var style=document.createElement('style');
    style.textContent='.u_sheets{padding:10px}.gdr-loading{background:#3B8686;color:#FFF;padding:8px;border-radius:5px;margin-bottom:10px;text-align:center;font-weight:bold;font-size:12px}.gdr-section{margin-bottom:12px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.gdr-section h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.gdr-count{color:#3B8686;font-weight:normal;font-size:12px}.gdr-sheets-list{list-style:none;padding:0;margin:0;overflow-y:auto;max-height:140px}.gdr-sheets-list li{padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px}.gdr-sheet-title{color:#292354;text-decoration:none;font-weight:600;font-size:13px;display:block;margin-bottom:4px}.gdr-sheet-dates{display:flex;gap:6px;flex-wrap:wrap}.gdr-date-created,.gdr-date-modified{font-size:10px;padding:2px 5px;border-radius:3px;color:#FFF}.gdr-date-created{background:#79BD9A}.gdr-date-modified{background:#3B8686}.gdr-empty{color:#3B8686;font-style:italic;padding:6px;font-size:12px}';
    document.head.appendChild(style);
})();




// ============================================================
// GREED ISLAND — Minigame gatcha (mobile)
// ============================================================
//  Config (dati) + logica in un unico IIFE, come gli altri
//  script mobile. Differenze dal desktop:
//    - guard/topic via window.HxHFramework (F.location)
//    - utente via Commons.user (id + nickname), non dal DOM

;(function() {

    var F = window.HxHFramework;
    if (!F) return;
    var FW = F; // alias: la logica riusata dal desktop usa "FW"

    // ---- CONFIG (dati modificabili) ----
    var CONFIG = {
        TOPIC_ID: '81151008',
        SECTION_ID: '65073571',
        FIREBASE_DB_URL: 'https://greed-island-9c98e-default-rtdb.europe-west1.firebasedatabase.app',
        ENFORCE_TURN_RULE: true,
        POST_TO_TOPIC: true
    };
    var IMG_BASE = 'https://upload.forumfree.net/i/ff13540297/HxH/GreedIsland/';
    var CARD_BACK = 'https://upload.forumfree.net/i/ff13540297/HxH/GreedIsland/Carte-Retro.png';
    var MALUS_ID = -3;
    var RANK_WEIGHTS = { SS: 5, S: 10, A: 20, B: 45, D: 10, MALUS: 10 };

    // Le 100 carte collezionabili: solo numero (id) e rank.
    var CARDS_SRC = [
        {id:0,rank:'SS'}, {id:1,rank:'SS'}, {id:2,rank:'SS'}, {id:3,rank:'A'}, {id:4,rank:'A'},
        {id:5,rank:'S'}, {id:6,rank:'A'}, {id:7,rank:'S'}, {id:8,rank:'S'}, {id:9,rank:'S'},
        {id:10,rank:'A'}, {id:11,rank:'B'}, {id:12,rank:'S'}, {id:13,rank:'A'}, {id:14,rank:'B'},
        {id:15,rank:'S'}, {id:16,rank:'S'}, {id:17,rank:'SS'}, {id:18,rank:'A'}, {id:19,rank:'A'},
        {id:20,rank:'B'}, {id:21,rank:'B'}, {id:22,rank:'A'}, {id:23,rank:'B'}, {id:24,rank:'A'},
        {id:25,rank:'B'}, {id:26,rank:'A'}, {id:27,rank:'B'}, {id:28,rank:'B'}, {id:29,rank:'A'},
        {id:30,rank:'B'}, {id:31,rank:'S'}, {id:32,rank:'B'}, {id:33,rank:'S'}, {id:34,rank:'B'},
        {id:35,rank:'S'}, {id:36,rank:'S'}, {id:37,rank:'B'}, {id:38,rank:'B'}, {id:39,rank:'B'},
        {id:40,rank:'B'}, {id:41,rank:'B'}, {id:42,rank:'B'}, {id:43,rank:'B'}, {id:44,rank:'B'},
        {id:45,rank:'B'}, {id:46,rank:'A'}, {id:47,rank:'A'}, {id:48,rank:'A'}, {id:49,rank:'A'},
        {id:50,rank:'A'}, {id:51,rank:'S'}, {id:52,rank:'B'}, {id:53,rank:'A'}, {id:54,rank:'A'},
        {id:55,rank:'A'}, {id:56,rank:'B'}, {id:57,rank:'A'}, {id:58,rank:'A'}, {id:59,rank:'A'},
        {id:60,rank:'B'}, {id:61,rank:'A'}, {id:62,rank:'B'}, {id:63,rank:'B'}, {id:64,rank:'B'},
        {id:65,rank:'S'}, {id:66,rank:'B'}, {id:67,rank:'B'}, {id:68,rank:'A'}, {id:69,rank:'B'},
        {id:70,rank:'A'}, {id:71,rank:'A'}, {id:72,rank:'A'}, {id:73,rank:'A'}, {id:74,rank:'A'},
        {id:75,rank:'A'}, {id:76,rank:'B'}, {id:77,rank:'S'}, {id:78,rank:'B'}, {id:79,rank:'A'},
        {id:80,rank:'S'}, {id:81,rank:'SS'}, {id:82,rank:'A'}, {id:83,rank:'B'}, {id:84,rank:'D'},
        {id:85,rank:'S'}, {id:86,rank:'A'}, {id:87,rank:'S'}, {id:88,rank:'A'}, {id:89,rank:'A'},
        {id:90,rank:'A'}, {id:91,rank:'A'}, {id:92,rank:'S'}, {id:93,rank:'B'}, {id:94,rank:'S'},
        {id:95,rank:'A'}, {id:96,rank:'A'}, {id:97,rank:'A'}, {id:98,rank:'S'}, {id:99,rank:'S'}
    ];

    // Icona SVG del bottone "Pesca carta".
    var DRAW_ICON_SVG = '<svg viewBox="0 0 151.6 150.2" width="28" height="28" style="display:block;fill:currentColor;" xmlns="http://www.w3.org/2000/svg"><polygon points="75.7,0.2 65.2,22.6 86.1,22.6"/><polygon points="86.2,127.7 75.8,150.2 65.3,127.7"/><polygon points="129.1,64.7 151.6,75 129.1,85.5"/><polygon points="22.4,64.7 0,75 22.4,85.5"/><path d="M75.8,26.9c-26.6,0-48.2,21.6-48.2,48.2c0,26.6,21.6,48.2,48.2,48.2c26.6,0,48.2-21.6,48.2-48.2C123.9,48.5,102.4,26.9,75.8,26.9z M75.8,115.8c-22.5,0-40.7-18.2-40.7-40.7c0-22.5,18.2-40.7,40.7-40.7c22.5,0,40.7,18.2,40.7,40.7C116.5,97.6,98.3,115.8,75.8,115.8z"/><path d="M75.5,40.9c-18.8,0-34.1,15.3-34.1,34.1s15.3,34.1,34.1,34.1c18.8,0,34.1-15.3,34.1-34.1S94.3,40.9,75.5,40.9z M75.7,102C60.8,102,48.7,89.9,48.7,75s12.1-27.1,27.1-27.1c14.9,0,27.1,12.1,27.1,27.1S90.7,102,75.7,102z"/><circle cx="75.4" cy="75" r="17.4"/></svg>';

    function imgUrl(id) {
        var s;
        if (id < 0) { s = '-' + ('00' + Math.abs(id)).slice(-3); }
        else { s = ('00' + id).slice(-3); }
        return IMG_BASE + s + '.png';
    }

    var CARDS = [];
    for (var _i = 0; _i < CARDS_SRC.length; _i++) {
        CARDS.push({ id: CARDS_SRC[_i].id, rank: CARDS_SRC[_i].rank, img: imgUrl(CARDS_SRC[_i].id) });
    }

    var MALUS_CARD = { id: MALUS_ID, rank: null, img: imgUrl(MALUS_ID) };
    var TOTAL_CARDS = CARDS.length;

// -- Nomi ufficiali (inglese) delle 100 carte collezionabili. --
var NAMES = {
    0: "Ruler's Blessing",
    1: "Patch of Forest",
    2: "Plot of Beach",
    3: "Pitcher of Eternal Water",
    4: "Skin Care Hot Springs",
    5: "Spirited Away Hollow",
    6: "Liquor Spring",
    7: "Pregnancy Stones",
    8: "Mystery Pond",
    9: "Tree of Plenty",
    10: "Golden Guidebook",
    11: "Golden Scales",
    12: "Golden Dictionary",
    13: "Luck Bankbook",
    14: "Connection Severing Scissors",
    15: "Fickle Genie",
    16: "Fairy King's Advice",
    17: "Angel's Breath",
    18: "Imp's Wink",
    19: "Poltergeist Pillow",
    20: "Mood Clock",
    21: "X-Ray Goggles",
    22: "Toraemon",
    23: "Tome of a Thousand Tales",
    24: "Hypothetical T.V.",
    25: "Risky Dice",
    26: "Night Shift Dwarves",
    27: "Book of V.I.P Passes",
    28: "Capricious Remote",
    29: "Pre-Order Vouchers",
    30: "Favor Cushion",
    31: "Double Postcard to the Dead",
    32: "Parrot Candy",
    33: "Hormone Cookies",
    34: "Universal Survey",
    35: "Chameleon Cat",
    36: "Recycling Room",
    37: "Fledgling Athlete",
    38: "Fledgling Artist",
    39: "Fledgling Politician",
    40: "Fledgling Musician",
    41: "Fledgling Pilot",
    42: "Fledgling Novelist",
    43: "Fledgling Gambler",
    44: "Fledgling Actor",
    45: "Fledgling CEO",
    46: "Gold Dust Girl",
    47: "Sleeping Girl",
    48: "Aromatherapy Girl",
    49: "Miniature Mermaid",
    50: "Miniature Dino",
    51: "Miniature Dragon",
    52: "Pearl Locusts",
    53: "King White Stag Beetle",
    54: "Millennium Butterfly",
    55: "Revenge Shop",
    56: "Perfect Memory Studio",
    57: "Hideout Realtor",
    58: "Secrets Video Rental",
    59: "Instant Foreign Language School",
    60: "Long Lost Delivery",
    61: "Vending Check-Up",
    62: 'Club "You Rule"',
    63: "Virtual Restaurant",
    64: "Witch's Love Potion",
    65: "Witch's Rejuvenation Potion",
    66: "Witch's Diet Pills",
    67: "Doyen's Growth Pills",
    68: "Doyen's Virility Pills",
    69: "Doyen's Hair Restorer",
    70: "Mad Scientist's Steroids",
    71: "Mad Scientist's Pheromones",
    72: "Mad Scientist's Plastic Surgery",
    73: "Night Jade",
    74: "Sage's Aquamarine",
    75: "Wild Luck Alexandrite",
    76: "Roaming Ruby",
    77: "Beauty Magnet Emerald",
    78: "Lonely Sapphire",
    79: "Rainbow Diamond",
    80: "Levitation Stone",
    81: "Blue Planet",
    82: "Staff of Judgment",
    83: "Sword of Truth",
    84: "Paladin's Necklace",
    85: "Sacrifice Armor",
    86: "Quiver of Frustration",
    87: "Shield of Faith",
    88: "Eternal Hammer",
    89: "Tax Collector's Gauntlet",
    90: "Memory Helmet",
    91: "Plastic King",
    92: "Swap Ticket",
    93: "Book of Life",
    94: "Bandit's Blade",
    95: "Secret Cape",
    96: "Clairvoyant Snake",
    97: "3-D Camera",
    98: "Silver Dog",
    99: "Panda Maid"
};

    // ---- GUARD: attivo solo nel topic del minigame ----
    if (!F.location.isTopic() || F.location.getTopicId() !== String(CONFIG.TOPIC_ID)) {
        return;
    }

    // ---- UTENTE LOGGATO: da Commons.user (mobile) ----
    var USER = null;
    if (window.Commons && Commons.user && Commons.user.id) {
        USER = { id: String(Commons.user.id), name: Commons.user.nickname || ('Utente ' + Commons.user.id) };
    }
    if (!USER) {
        console.warn('[GreedIsland mobile] Utente non identificato.');
        return;
    }

// FIREBASE  —  REST API (niente SDK)
// ----------------------------------------
//
// Struttura dati:
//   /greedisland/players/<userId> = { name: "...", cards: { "3": true, "7": true } }
//   /greedisland/meta/lastDrawUserId = "<userId>"

var DB = CONFIG.FIREBASE_DB_URL.replace(/\/+$/, '');

function fbGet(path, callback) {
    fetch(DB + path + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) { callback(null, data); })
        .catch(function(e) { callback(e, null); });
}

function fbPut(path, value, callback) {
    fetch(DB + path + '.json', {
        method: 'PUT',
        body: JSON.stringify(value)
    })
        .then(function(r) { return r.json(); })
        .then(function(data) { callback(null, data); })
        .catch(function(e) { callback(e, null); });
}

// LOGICA DI GIOCO
// ----------------------------------------

function getCardById(id) {
    for (var i = 0; i < CARDS.length; i++) {
        if (CARDS[i].id === id) return CARDS[i];
    }
    return null;
}

/**
 * Numero carta formattato a 3 cifre: 5 -> "005", 62 -> "062".
 * Il malus (-3) diventa "-003".
 */
function cardNum(card) {
    if (card.id < 0) {
        return '-' + ('00' + Math.abs(card.id)).slice(-3);
    }
    return ('00' + card.id).slice(-3);
}

/**
 * Nome di una carta. Le collezionabili lo prendono da NAMES;
 * il malus (-003) ha nome fisso "Eliminate".
 */
function cardName(card) {
    if (card.id < 0) return 'Eliminate';
    var nm = NAMES[card.id];
    return nm ? nm : ('Carta ' + cardNum(card));
}

/**
 * Rank leggibile: le carte usano il loro rank; il malus non ha un
 * vero rank e mostra "Game Master".
 * Il valore di card.rank arriva dal config incollato nel forum: se
 * ForumFree ci ha iniettato caratteri invisibili (es. soft hyphen dopo
 * la "S"), li rimuoviamo tenendo solo lettere e spazi.
 */
function cardRankLabel(card) {
    if (!card.rank) return 'Game Master';
    // Prima toglie eventuali entity HTML (es. il testo "&shy;"), poi
    // tiene solo lettere A-Z e spazi (elimina soft hyphen e altri residui).
    return String(card.rank).replace(/&[a-z]+;/gi, '').replace(/[^A-Za-z ]/g, '');
}

/**
 * Etichetta testuale completa di una carta:
 *   "Carta #005 - Nome - [Rank B]"
 *   "Carta #-003 - Eliminate - [Rank Game Master]"
 */
function cardLabel(card) {
    return 'Carta #' + cardNum(card) +
        ' - ' + cardName(card) +
        ' - [Rank ' + cardRankLabel(card) + ']';
}

/**
 * Versione HTML dell'etichetta per i POST.
 * Il nome passa in escapeHTML; il resto è testo sicuro. Nessun trucco
 * extra: "[Rank S]" scritto normalmente nel post non dà problemi.
 */
function cardLabelHTML(card) {
    return escapeHTML(cardLabel(card));
}

/**
 * Restituisce tutte le carte collezionabili di un dato rank.
 */
function cardsOfRank(rank) {
    var out = [];
    for (var i = 0; i < CARDS.length; i++) {
        if (CARDS[i].rank === rank) out.push(CARDS[i]);
    }
    return out;
}

/**
 * Sorteggia una carta secondo RANK_WEIGHTS.
 * 1) Sceglie un "esito" (un rank, oppure MALUS) pesato sulle percentuali.
 * 2) Se è MALUS, restituisce la carta -003. Altrimenti pesca a caso una
 *    carta collezionabile dentro il rank scelto.
 *
 * @returns {{card: object, isMalus: boolean}}
 */
function pickCard() {
    // Somma dei pesi (di norma 100, ma calcolata per robustezza).
    var total = 0;
    var key;
    for (key in RANK_WEIGHTS) {
        if (RANK_WEIGHTS.hasOwnProperty(key)) total += RANK_WEIGHTS[key];
    }

    // Estrazione pesata dell'esito.
    var roll = Math.random() * total;
    var acc = 0;
    var chosen = null;
    for (key in RANK_WEIGHTS) {
        if (!RANK_WEIGHTS.hasOwnProperty(key)) continue;
        acc += RANK_WEIGHTS[key];
        if (roll < acc) { chosen = key; break; }
    }
    if (chosen === null) chosen = 'B'; // fallback difensivo

    // Malus: nessuna carta collezionabile.
    if (chosen === 'MALUS') {
        return { card: MALUS_CARD, isMalus: true };
    }

    // Pesca una carta a caso nel rank scelto.
    var pool = cardsOfRank(chosen);
    if (pool.length === 0) {
        // Rank senza carte (non dovrebbe capitare): ripiega su tutta la lista.
        pool = CARDS;
    }
    var card = pool[Math.floor(Math.random() * pool.length)];
    return { card: card, isMalus: false };
}

/**
 * Esegue una pesca: controlla la regola dei turni, sorteggia una carta
 * secondo i pesi per rank, salva su Firebase (se non è il malus),
 * posta nel topic.
 */
function drawCard(onDone) {
    // 1. Regola dei turni: non due pesche consecutive dallo stesso utente.
    fbGet('/greedisland/meta/lastDrawUserId', function(err, lastId) {
        if (!err && CONFIG.ENFORCE_TURN_RULE && lastId && String(lastId) === String(USER.id)) {
            onDone({ ok: false, reason: 'turn' });
            return;
        }

        // 2. Sorteggia la carta (o il malus) secondo RANK_WEIGHTS.
        var pick = pickCard();
        var card = pick.card;
        var isMalus = pick.isMalus;

        // 3. Leggi lo stato attuale del giocatore.
        fbGet('/greedisland/players/' + USER.id, function(err2, player) {
            player = player || { name: USER.name, cards: {} };
            player.name = USER.name; // aggiorna nome in caso sia cambiato
            if (!player.cards) player.cards = {};

            // 4. Se NON è il malus, aggiungi la carta alla collezione.
            var isNew = false;
            if (!isMalus) {
                isNew = !player.cards[card.id];
                player.cards[card.id] = true;
            }

            // 5. Salva il giocatore (sempre, così il nome resta aggiornato;
            //    col malus la collezione resta invariata).
            fbPut('/greedisland/players/' + USER.id, player, function(err3) {
                if (err3) { onDone({ ok: false, reason: 'db' }); return; }

                // 6. Aggiorna lastDrawUserId (anche il malus "consuma" il turno).
                fbPut('/greedisland/meta/lastDrawUserId', USER.id, function() {
                    var owned = countOwned(player);

                    // 7. Post e animazione IN PARALLELO:
                    //    - il post parte subito, così ForumFree ha tutto il
                    //      tempo dell'animazione per registrarlo (altrimenti
                    //      #lastpost punterebbe al post precedente al nostro);
                    //    - l'animazione scorre;
                    //    - a fine ANIMAZIONE si completa (-> reload), a
                    //      prescindere dall'esito del post: la carta e' gia'
                    //      salvata su Firebase, quindi non si perde nulla.
                    announceDrawInTopic(card, owned, isMalus, function() {
                        // post concluso (o loggato): nessuna azione, il reload
                        // e' guidato dalla fine dell'animazione qui sotto.
                    });

                    playDrawAnimation(card, isMalus, function() {
                        onDone({ ok: true, card: card, isNew: isNew, owned: owned, isMalus: isMalus });
                    });
                });
            });
        });
    });
}

function countOwned(player) {
    if (!player || !player.cards) return 0;
    var n = 0;
    for (var i = 0; i < CARDS.length; i++) {
        if (player.cards[CARDS[i].id]) n++;
    }
    return n;
}

/**
 * Posta il risultato della pesca nel topic tramite il framework.
 */
function announceDrawInTopic(card, owned, isMalus, cb) {
    if (!CONFIG.POST_TO_TOPIC) {
        console.log('[GreedIsland] (post disattivato) ' + USER.name + ' -> ' + cardLabel(card));
        cb();
        return;
    }

    var html = buildDrawPostHTML(card, owned, isMalus);

    FW.requests.fetchToken(function(token) {
        // DEBUG TEMPORANEO (mobile): verifica il recupero del token.
        if (!token) {
            alert('DEBUG mobile\n\nTOKEN NON RECUPERATO.\nIl post non parte per questo motivo.');
            cb();
            return;
        }
        alert('DEBUG mobile\n\nToken OK: ' + String(token).substring(0, 12) + '...\nProvo a postare.');
        FW.requests.postComment(token, CONFIG.SECTION_ID, CONFIG.TOPIC_ID, html, function(ok) {
            alert('DEBUG mobile\n\nEsito post: ' + (ok ? 'OK (confermato)' : 'NON confermato'));
            cb();
        });
    });
}

// HTML DEI POST  —  tutto inline (vincolo ForumFree)
// ----------------------------------------

function buildDrawPostHTML(card, owned, isMalus) {
    var label = cardLabel(card); // "Carta #NNN - Nome - [Rank X]"

    if (isMalus) {
        // Post speciale per la carta -003 Eliminate: espulsione, nessuna carta.
        return '' +
            '<div style="border:1px solid #a03030;background:#2a1414;padding:14px;max-width:400px;font-family:montserrat,sans-serif;color:#f2c4c4;">' +
                '<div style="font-family:\'Alegreya Sans SC\',sans-serif;font-size:16px;color:#ff8080;margin-bottom:8px;text-align:center;letter-spacing:1px;">' +
                    'Hai pescato la carta:' +
                '</div>' +
                '<div style="text-align:center;margin:8px 0;">' +
                    '<img src="' + card.img + '" alt="' + escapeHTML(label) + '"' +
                    ' style="max-width:100%;height:auto;border:2px solid #a03030;border-radius:4px;">' +
                '</div>' +
                '<div style="text-align:center;font-size:14px;color:#f2c4c4;">' +
                    '<b>' + cardLabelHTML(card) + '</b>' +
                '</div>' +
                '<div style="text-align:center;font-size:13px;color:#ff8080;margin-top:8px;">' +
                    'Sei stato espulso da Greed Island! Nessuna carta ottenuta.' +
                '</div>' +
            '</div>';
    }

    // Post normale. Immagine a dimensione naturale, limitata dal div (400px).
    var img = '<img src="' + card.img + '" alt="' + escapeHTML(label) + '"' +
        ' style="max-width:100%;height:auto;border:2px solid #79BD9A;border-radius:4px;">';

    return '' +
        '<div style="border:1px solid #3B8686;background:#292354;padding:14px;max-width:400px;font-family:montserrat,sans-serif;color:#E2F7C4;">' +
            '<div style="font-family:\'Alegreya Sans SC\',sans-serif;font-size:16px;color:#CFF09E;margin-bottom:8px;text-align:center;letter-spacing:1px;">' +
                'Hai pescato la carta:' +
            '</div>' +
            '<div style="text-align:center;margin:8px 0;">' +
                img +
            '</div>' +
            '<div style="text-align:center;font-size:14px;color:#E2F7C4;">' +
                '<b>' + cardLabelHTML(card) + '</b>' +
            '</div>' +
            '<div style="text-align:center;font-size:12px;color:#8FBEBA;margin-top:8px;">' +
                'Collezione: ' + owned + '/' + TOTAL_CARDS +
            '</div>' +
        '</div>';
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// UI  —  pannello laterale + modali (tutto inline)
// ----------------------------------------

var el = {}; // riferimenti agli elementi

function buildPanel() {
    var panel = document.createElement('div');
    panel.id = 'gi-panel';
    // Mobile: nessun box, solo i tre bottoni circolari attaccati al bordo
    // destro e centrati verticalmente.
    panel.style.cssText = 'position:fixed;top:50%;right:4px;z-index:9998;' +
        'transform:translateY(-50%);' +
        'display:flex;flex-direction:column;gap:10px;' +
        'background:transparent;border:none;padding:0;';

    el.drawBtn       = makeButton('Pesca carta', DRAW_ICON_SVG,   '#79BD9A', '#292354');
    el.collectionBtn = makeButton('Collezione',  'fa-layer-group',  '#3B8686', '#E2F7C4');
    el.rankingBtn    = makeButton('Classifica',  'fa-ranking-star', '#3B8686', '#E2F7C4');

    panel.appendChild(el.drawBtn);
    panel.appendChild(el.collectionBtn);
    panel.appendChild(el.rankingBtn);

    document.body.appendChild(panel);

    el.drawBtn.addEventListener('click', onDrawClick);
    el.collectionBtn.addEventListener('click', openCollection);
    el.rankingBtn.addEventListener('click', openRanking);
}

/**
 * Mobile: bottone CIRCOLARE con la sola icona (niente testo, per
 * risparmiare spazio). L'icona può essere un SVG inline (se inizia con
 * "<svg") o una classe Font Awesome.
 * Il testo dell'etichetta finisce nel title (tooltip) e in aria-label.
 * b._label resta come oggetto fittizio: onDrawClick ci scrive il testo
 * di stato ("Pesco...", "Fatto!") e lo riversiamo nel title, senza
 * rompere nulla e senza mostrare testo nel bottone.
 */
function makeButton(label, iconSpec, bg, fg) {
    var b = document.createElement('button');
    b.title = label;
    b.setAttribute('aria-label', label);
    b.style.cssText = 'cursor:pointer;border:1px solid #3B8686;' +
        'width:52px;height:52px;border-radius:50%;padding:0;' +
        'background:' + bg + ';color:' + fg + ';' +
        'display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.4);' +
        'font-family:montserrat,sans-serif;';

    var icon;
    if (iconSpec.indexOf('<svg') === 0) {
        icon = document.createElement('span');
        icon.style.cssText = 'display:inline-flex;align-items:center;';
        icon.innerHTML = iconSpec;
    } else {
        icon = document.createElement('i');
        icon.className = 'fa-solid ' + iconSpec;
        icon.style.cssText = 'font-size:22px;';
    }

    b.appendChild(icon);

    // Etichetta nascosta: uno <span> reale ma non visibile. Così
    // onDrawClick può continuare a fare _label.textContent = '...'
    // senza rischi (niente getter/setter) e senza mostrare testo.
    var hidden = document.createElement('span');
    hidden.textContent = label;
    hidden.style.cssText = 'display:none;';
    b.appendChild(hidden);
    b._label = hidden;

    return b;
}

function onDrawClick() {
    el.drawBtn.disabled = true;
    el.drawBtn._label.textContent = 'Pesco...';

    drawCard(function(res) {
        if (!res.ok) {
            el.drawBtn.disabled = false;
            el.drawBtn._label.textContent = 'Pesca carta';
            if (res.reason === 'turn') {
                alert('Devi aspettare che peschi un altro giocatore prima di pescare di nuovo!');
            } else {
                alert('Errore durante la pesca. Riprova.');
            }
            return;
        }

        // Successo. Il post è partito all'inizio dell'animazione, quindi
        // ForumFree ha già avuto tutta la durata dell'animazione (~5s) per
        // registrarlo. Per portarci all'ultimo post usiamo il formato
        // server-side di ForumFree "view=getlastpost": a differenza di un
        // semplice #anchor, questo calcola lato server la PAGINA giusta del
        // topic (i topic multi-pagina altrimenti si aprono sulla pagina 1,
        // dove l'anchor non trova nulla e si finisce "a metà").
        el.drawBtn._label.textContent = 'Fatto!';
        var topicUrl = 'https://' + location.hostname + '/?t=' + CONFIG.TOPIC_ID + '&view=getlastpost';
        location.replace(topicUrl);
    });
}

// ── Modale generico ──────────────────────────────────────────────

function openModal(titleText, contentNode) {
    closeModal(); // eventuale modale aperto

    var overlay = document.createElement('div');
    overlay.id = 'gi-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;' +
        'background:rgba(0,0,0,.6);display:flex;align-items:center;' +
        'justify-content:center;font-family:montserrat,sans-serif;';

    var box = document.createElement('div');
    box.style.cssText = 'background:#292354;border:2px solid #3B8686;' +
        'border-radius:8px;max-width:560px;width:90%;max-height:80vh;' +
        'overflow:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;' +
        'align-items:center;padding:12px 16px;background:#0B486B;' +
        'border-radius:6px 6px 0 0;';

    var h = document.createElement('div');
    h.textContent = titleText;
    h.style.cssText = "font-family:'Alegreya Sans SC',sans-serif;" +
        'color:#CFF09E;font-weight:bold;font-size:17px;letter-spacing:1px;';

    var x = document.createElement('button');
    x.className = 'fa-solid fa-xmark';
    x.style.cssText = 'cursor:pointer;background:transparent;border:none;' +
        'color:#CFF09E;font-size:18px;font-weight:bold;';
    x.addEventListener('click', closeModal);

    header.appendChild(h);
    header.appendChild(x);

    var body = document.createElement('div');
    body.style.cssText = 'padding:16px;';
    body.appendChild(contentNode);

    box.appendChild(header);
    box.appendChild(body);
    overlay.appendChild(box);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
}

function closeModal() {
    var ex = document.getElementById('gi-modal-overlay');
    if (ex) ex.parentNode.removeChild(ex);
}

// ── Modale collezione ────────────────────────────────────────────

function openCollection() {
    var loading = document.createElement('div');
    loading.textContent = 'Caricamento...';
    loading.style.cssText = 'text-align:center;color:#8FBEBA;';
    openModal('La tua collezione', loading);

    fbGet('/greedisland/players/' + USER.id, function(err, player) {
        var owned = (player && player.cards) ? player.cards : {};
        var ownedCount = countOwned(player);

        var wrap = document.createElement('div');

        var summary = document.createElement('div');
        summary.style.cssText = 'text-align:center;font-size:14px;color:#CFF09E;margin-bottom:12px;';
        summary.innerHTML = '<b>' + ownedCount + '</b> / ' + TOTAL_CARDS + ' carte collezionate';
        wrap.appendChild(summary);

        var grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;';

        for (var i = 0; i < CARDS.length; i++) {
            (function(c) {
                var has = !!owned[c.id];

                var cell = document.createElement('div');
                cell.style.cssText = 'width:110px;text-align:center;font-size:11px;color:#E2F7C4;' +
                    (has ? '' : 'opacity:.4;filter:grayscale(1);');

                var img = document.createElement('img');
                img.src = c.img;
                img.alt = cardLabel(c);
                img.style.cssText = 'width:100px;border:2px solid ' +
                    (has ? '#79BD9A' : '#8FBEBA') + ';border-radius:4px;' +
                    (has ? 'cursor:pointer;' : '');

                // Solo le carte possedute sono cliccabili per l'ingrandimento.
                if (has) {
                    img.addEventListener('click', function() { openCardZoom(c); });
                }

                var nm = document.createElement('div');
                nm.textContent = has ? ('#' + cardNum(c) + ' - ' + cardName(c)) : '???';
                nm.style.cssText = 'margin-top:4px;color:#E2F7C4;';

                cell.appendChild(img);
                cell.appendChild(nm);
                grid.appendChild(cell);
            })(CARDS[i]);
        }

        wrap.appendChild(grid);
        replaceModalBody(wrap);
    });
}

/**
 * Overlay che mostra una carta ingrandita. Cliccando fuori si chiude.
 * È indipendente dal modale collezione (ci si sovrappone).
 */
function openCardZoom(card) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;' +
        'background:rgba(0,0,0,.8);display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;font-family:montserrat,sans-serif;';

    var img = document.createElement('img');
    img.src = card.img;
    img.alt = cardLabel(card);
    img.style.cssText = 'max-width:90%;max-height:80vh;height:auto;' +
        'border:3px solid #79BD9A;border-radius:6px;box-shadow:0 4px 24px rgba(0,0,0,.6);';

    var caption = document.createElement('div');
    caption.textContent = cardLabel(card);
    caption.style.cssText = 'margin-top:12px;color:#E2F7C4;font-size:14px;text-align:center;';

    overlay.appendChild(img);
    overlay.appendChild(caption);
    overlay.addEventListener('click', function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });

    document.body.appendChild(overlay);
}

// ── Modale classifica ────────────────────────────────────────────

function openRanking() {
    var loading = document.createElement('div');
    loading.textContent = 'Caricamento...';
    loading.style.cssText = 'text-align:center;color:#8FBEBA;';
    openModal('Classifica collezionisti', loading);

    fbGet('/greedisland/players', function(err, players) {
        players = players || {};

        var rows = [];
        for (var uid in players) {
            if (!players.hasOwnProperty(uid)) continue;
            rows.push({
                id: uid,
                name: players[uid].name || ('Utente ' + uid),
                count: countOwned(players[uid])
            });
        }

        rows.sort(function(a, b) { return b.count - a.count; });

        var wrap = document.createElement('div');

        if (rows.length === 0) {
            wrap.textContent = 'Ancora nessun collezionista. Sii il primo a pescare!';
            wrap.style.cssText = 'text-align:center;color:#8FBEBA;';
            replaceModalBody(wrap);
            return;
        }

        var table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

        // Colori del podio per i primi 3 (oro, argento, bronzo).
        var podium = [
            { bg: '#4a3b0a', accent: '#ffd447', icon: 'fa-trophy' },       // 1°
            { bg: '#3a3f45', accent: '#d4dbe2', icon: 'fa-medal' },        // 2°
            { bg: '#40301c', accent: '#e0a066', icon: 'fa-medal' }         // 3°
        ];

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var isMe = String(r.id) === String(USER.id);
            var isPodium = i < 3;
            var p = isPodium ? podium[i] : null;

            var tr = document.createElement('tr');
            var rowBg = isPodium ? p.bg : (isMe ? '#0B486B' : 'transparent');
            tr.style.cssText = 'border-bottom:1px solid #3B8686;background:' + rowBg + ';' +
                (isMe ? 'outline:2px solid #79BD9A;outline-offset:-2px;' : '');

            var pos = document.createElement('td');
            pos.style.cssText = 'padding:10px 8px;width:44px;text-align:center;font-weight:bold;' +
                'font-size:15px;color:' + (isPodium ? p.accent : '#CFF09E') + ';';
            if (isPodium) {
                // Medaglia + numero.
                var medal = document.createElement('i');
                medal.className = 'fa-solid ' + p.icon;
                medal.style.cssText = 'margin-right:4px;';
                pos.appendChild(medal);
                pos.appendChild(document.createTextNode(String(i + 1)));
            } else {
                pos.textContent = (i + 1);
            }

            var nm = document.createElement('td');
            nm.textContent = r.name;
            nm.style.cssText = 'padding:10px 8px;color:' +
                (isPodium ? '#ffffff' : '#E2F7C4') + ';' +
                (isPodium ? 'font-weight:bold;' : '');

            var cnt = document.createElement('td');
            cnt.textContent = r.count + '/' + TOTAL_CARDS;
            cnt.style.cssText = 'padding:10px 8px;width:80px;text-align:right;color:' +
                (isPodium ? p.accent : '#8FBEBA') + ';font-weight:' +
                (isPodium ? 'bold' : 'normal') + ';';

            tr.appendChild(pos);
            tr.appendChild(nm);
            tr.appendChild(cnt);
            table.appendChild(tr);
        }

        wrap.appendChild(table);
        replaceModalBody(wrap);
    });
}

function replaceModalBody(node) {
    var overlay = document.getElementById('gi-modal-overlay');
    if (!overlay) return;
    var body = overlay.querySelector('div > div:last-child');
    // il body è il secondo figlio del box
    var box = overlay.firstChild;
    var b = box.childNodes[1];
    if (b) {
        b.innerHTML = '';
        b.appendChild(node);
    }
}

// ANIMAZIONE DI PESCA  —  flip carta + ingrandimento + coriandoli
// ----------------------------------------

/**
 * Inietta una sola volta i keyframes usati dall'animazione di pesca.
 */
function ensureDrawAnimStyle() {
    if (document.getElementById('gi-draw-style')) return;
    var st = document.createElement('style');
    st.id = 'gi-draw-style';
    st.textContent =
        '@keyframes gi-fade-out { to { opacity:0; visibility:hidden; } }' +
        // Il "flip": ruota su Y più volte, poi si ferma sul fronte (360deg finali).
        '@keyframes gi-flip {' +
        '  0%   { transform: rotateY(0deg); }' +
        '  100% { transform: rotateY(1800deg); }' +   // 5 giri completi in ~2s
        '}' +
        // Dopo il flip: piccolo ingrandimento "pop".
        '@keyframes gi-pop {' +
        '  0%   { transform: scale(1); }' +
        '  60%  { transform: scale(1.25); }' +
        '  100% { transform: scale(1.15); }' +
        '}' +
        // Coriandoli: volano verso l\'alto/lati e svaniscono. Impostati via JS.
        '@keyframes gi-confetti {' +
        '  0%   { opacity:1; transform: translate(0,0) rotate(0deg); }' +
        '  100% { opacity:0; transform: translate(var(--dx), var(--dy)) rotate(var(--dr)); }' +
        '}';
    document.head.appendChild(st);
}

/**
 * Mostra l'animazione della carta pescata e, al termine, chiama done().
 *   - la carta gira fronte/retro per ~2s
 *   - si ferma sul fronte e si ingrandisce
 *   - se NON è il malus, spara coriandoli attorno
 * Se manca CARD_BACK, salta l'animazione e chiama subito done().
 *
 * @param {object} card    la carta pescata (ha .img del fronte)
 * @param {boolean} isMalus se true, niente coriandoli
 * @param {function} done   callback di fine animazione
 */
function playDrawAnimation(card, isMalus, done) {
    if (!CARD_BACK) { done(); return; }
    ensureDrawAnimStyle();

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;' +
        'background:rgba(10,8,20,.78);display:flex;align-items:center;' +
        'justify-content:center;overflow:hidden;';

    // Contenitore con prospettiva 3D per il flip.
    var stage = document.createElement('div');
    stage.style.cssText = 'perspective:1200px;width:280px;height:392px;position:relative;';

    // La carta: un contenitore che ruota, con due facce (fronte/retro).
    var flipper = document.createElement('div');
    flipper.style.cssText = 'position:relative;width:100%;height:100%;' +
        'transform-style:preserve-3d;' +
        'animation:gi-flip 2s ease-out forwards;';

    var faceStyle = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.6);' +
        'background-size:cover;background-position:center;';

    // Fronte: la carta pescata. Parte "davanti" (rotateY 0).
    var front = document.createElement('div');
    front.style.cssText = faceStyle + 'background-image:url(' + card.img + ');';

    // Retro: dietro, ruotato di 180deg così appare durante i giri.
    var back = document.createElement('div');
    back.style.cssText = faceStyle + 'background-image:url(' + CARD_BACK + ');' +
        'transform:rotateY(180deg);';

    flipper.appendChild(front);
    flipper.appendChild(back);
    stage.appendChild(flipper);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    // Fase 2 (dopo il flip, ~2s): ferma la rotazione sul fronte, ingrandisci,
    // e (se non malus) spara i coriandoli.
    setTimeout(function() {
        flipper.style.animation = 'none';
        flipper.style.transform = 'rotateY(0deg)';
        stage.style.animation = 'gi-pop .5s ease-out forwards';
        if (!isMalus) {
            spawnConfetti(overlay);
        }
    }, 2000);

    // Fase 3: dopo che l'utente ha visto la carta ingrandita (~2.3s),
    // dissolvi l'overlay e chiama done() (che farà partire post + reload).
    setTimeout(function() {
        overlay.style.animation = 'gi-fade-out .5s ease-in forwards';
    }, 4300);
    setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        done();
    }, 4800);
}

/**
 * Genera un burst di coriandoli colorati attorno al centro dell'overlay.
 */
function spawnConfetti(overlay) {
    var colors = ['#CFF09E', '#79BD9A', '#3B8686', '#E2F7C4', '#ffd447', '#ff8080', '#8FBEBA'];
    var N = 40;
    for (var i = 0; i < N; i++) {
        var piece = document.createElement('div');
        var size = 6 + Math.floor(Math.random() * 8);
        var color = colors[Math.floor(Math.random() * colors.length)];

        // Direzione casuale (angolo + distanza).
        var angle = Math.random() * Math.PI * 2;
        var dist = 120 + Math.random() * 220;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        var dr = (Math.random() * 720 - 360);
        var dur = 0.8 + Math.random() * 0.7;

        piece.style.cssText = 'position:absolute;top:50%;left:50%;' +
            'width:' + size + 'px;height:' + (size * 0.6) + 'px;' +
            'background:' + color + ';border-radius:2px;' +
            '--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;' +
            '--dr:' + dr.toFixed(0) + 'deg;' +
            'animation:gi-confetti ' + dur.toFixed(2) + 's ease-out forwards;';
        overlay.appendChild(piece);
    }
}

// ---- AVVIO ----
// Su mobile il DOM si popola in ritardo: usiamo injectWithRetry (come gli
// altri moduli mobile) per costruire il pannello quando document.body è
// pronto, evitando doppioni col controllo sull'id 'gi-panel'.
if (typeof injectWithRetry === 'function') {
    injectWithRetry(buildPanel, 'gi-panel', 20);
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
} else {
    buildPanel();
}

console.log('[GreedIsland mobile] avviato per ' + USER.name + ' (id ' + USER.id + ')');

})();


})(); // fine IIFE globale
