(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function _(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(i){if(i.ep)return;i.ep=!0;const n=_(i);fetch(i.href,n)}})();var B,f,fe,P,Z,ae,V,C={},pe=[],xe=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,J=Array.isArray;function E(t,e){for(var _ in e)t[_]=e[_];return t}function de(t){var e=t.parentNode;e&&e.removeChild(t)}function $e(t,e,_){var o,i,n,l={};for(n in e)n=="key"?o=e[n]:n=="ref"?i=e[n]:l[n]=e[n];if(arguments.length>2&&(l.children=arguments.length>3?B.call(arguments,2):_),typeof t=="function"&&t.defaultProps!=null)for(n in t.defaultProps)l[n]===void 0&&(l[n]=t.defaultProps[n]);return U(t,l,o,i,null)}function U(t,e,_,o,i){var n={type:t,props:e,key:_,ref:o,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:i??++fe,__i:-1};return i==null&&f.vnode!=null&&f.vnode(n),n}function I(t){return t.children}function A(t,e){this.props=t,this.context=e}function D(t,e){if(e==null)return t.__?D(t.__,t.__i+1):null;for(var _;e<t.__k.length;e++)if((_=t.__k[e])!=null&&_.__e!=null)return _.__e;return typeof t.type=="function"?D(t):null}function he(t){var e,_;if((t=t.__)!=null&&t.__c!=null){for(t.__e=t.__c.base=null,e=0;e<t.__k.length;e++)if((_=t.__k[e])!=null&&_.__e!=null){t.__e=t.__c.base=_.__e;break}return he(t)}}function X(t){(!t.__d&&(t.__d=!0)&&P.push(t)&&!W.__r++||Z!==f.debounceRendering)&&((Z=f.debounceRendering)||ae)(W)}function W(){var t,e,_,o,i,n,l,c,s;for(P.sort(V);t=P.shift();)t.__d&&(e=P.length,o=void 0,i=void 0,n=void 0,c=(l=(_=t).__v).__e,(s=_.__P)&&(o=[],i=[],(n=E({},l)).__v=l.__v+1,G(s,n,l,_.__n,s.ownerSVGElement!==void 0,l.__h!=null?[c]:null,o,c??D(l),l.__h,i),n.__.__k[n.__i]=n,ge(o,n,i),n.__e!=c&&he(n)),P.length>e&&P.sort(V));W.__r=0}function ve(t,e,_,o,i,n,l,c,s,h,d){var r,v,a,u,p,H,m,g,$,k=0,b=o&&o.__k||pe,T=b.length,S=T,N=e.length;for(_.__k=[],r=0;r<N;r++)(u=_.__k[r]=(u=e[r])==null||typeof u=="boolean"||typeof u=="function"?null:u.constructor==String||typeof u=="number"||typeof u=="bigint"?U(null,u,null,null,u):J(u)?U(I,{children:u},null,null,null):u.__b>0?U(u.type,u.props,u.key,u.ref?u.ref:null,u.__v):u)!=null?(u.__=_,u.__b=_.__b+1,u.__i=r,(g=Se(u,b,m=r+k,S))===-1?a=C:(a=b[g]||C,b[g]=void 0,S--),G(t,u,a,i,n,l,c,s,h,d),p=u.__e,(v=u.ref)&&a.ref!=v&&(a.ref&&K(a.ref,null,u),d.push(v,u.__c||p,u)),H==null&&p!=null&&(H=p),($=a===C||a.__v===null)?g==-1&&k--:g!==m&&(g===m+1?k++:g>m?S>N-m?k+=g-m:k--:k=g<m&&g==m-1?g-m:0),m=r+k,typeof u.type=="function"?(g!==m||a.__k===u.__k?s=me(u,s,t):u.__d!==void 0?s=u.__d:p&&(s=p.nextSibling),u.__d=void 0):p&&(s=g!==m||$?ye(t,p,s):p.nextSibling),typeof _.type=="function"&&(_.__d=s)):(a=b[r])&&a.key==null&&a.__e&&(a.__e==s&&(s=D(a),typeof _.type=="function"&&(_.__d=s)),q(a,a,!1),b[r]=null);for(_.__e=H,r=T;r--;)b[r]!=null&&(typeof _.type=="function"&&b[r].__e!=null&&b[r].__e==s&&(_.__d=b[r].__e.nextSibling),q(b[r],b[r]))}function me(t,e,_){for(var o,i=t.__k,n=0;i&&n<i.length;n++)(o=i[n])&&(o.__=t,e=typeof o.type=="function"?me(o,e,_):ye(_,o.__e,e));return e}function ye(t,e,_){return e!=_&&t.insertBefore(e,_||null),e.nextSibling}function Se(t,e,_,o){var i=t.key,n=t.type,l=_-1,c=_+1,s=e[_];if(s===null||s&&i==s.key&&n===s.type)return _;if(o>(s!=null?1:0))for(;l>=0||c<e.length;){if(l>=0){if((s=e[l])&&i==s.key&&n===s.type)return l;l--}if(c<e.length){if((s=e[c])&&i==s.key&&n===s.type)return c;c++}}return-1}function we(t,e,_,o,i){var n;for(n in _)n==="children"||n==="key"||n in e||M(t,n,null,_[n],o);for(n in e)i&&typeof e[n]!="function"||n==="children"||n==="key"||n==="value"||n==="checked"||_[n]===e[n]||M(t,n,e[n],_[n],o)}function Y(t,e,_){e[0]==="-"?t.setProperty(e,_??""):t[e]=_==null?"":typeof _!="number"||xe.test(e)?_:_+"px"}function M(t,e,_,o,i){var n;e:if(e==="style")if(typeof _=="string")t.style.cssText=_;else{if(typeof o=="string"&&(t.style.cssText=o=""),o)for(e in o)_&&e in _||Y(t.style,e,"");if(_)for(e in _)o&&_[e]===o[e]||Y(t.style,e,_[e])}else if(e[0]==="o"&&e[1]==="n")n=e!==(e=e.replace(/(PointerCapture)$|Capture$/,"$1")),e=e.toLowerCase()in t?e.toLowerCase().slice(2):e.slice(2),t.l||(t.l={}),t.l[e+n]=_,_?o?_.u=o.u:(_.u=Date.now(),t.addEventListener(e,n?te:ee,n)):t.removeEventListener(e,n?te:ee,n);else if(e!=="dangerouslySetInnerHTML"){if(i)e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!=="width"&&e!=="height"&&e!=="href"&&e!=="list"&&e!=="form"&&e!=="tabIndex"&&e!=="download"&&e!=="rowSpan"&&e!=="colSpan"&&e!=="role"&&e in t)try{t[e]=_??"";break e}catch{}typeof _=="function"||(_==null||_===!1&&e[4]!=="-"?t.removeAttribute(e):t.setAttribute(e,_))}}function ee(t){var e=this.l[t.type+!1];if(t.t){if(t.t<=e.u)return}else t.t=Date.now();return e(f.event?f.event(t):t)}function te(t){return this.l[t.type+!0](f.event?f.event(t):t)}function G(t,e,_,o,i,n,l,c,s,h){var d,r,v,a,u,p,H,m,g,$,k,b,T,S,N,x=e.type;if(e.constructor!==void 0)return null;_.__h!=null&&(s=_.__h,c=e.__e=_.__e,e.__h=null,n=[c]),(d=f.__b)&&d(e);e:if(typeof x=="function")try{if(m=e.props,g=(d=x.contextType)&&o[d.__c],$=d?g?g.props.value:d.__:o,_.__c?H=(r=e.__c=_.__c).__=r.__E:("prototype"in x&&x.prototype.render?e.__c=r=new x(m,$):(e.__c=r=new A(m,$),r.constructor=x,r.render=Pe),g&&g.sub(r),r.props=m,r.state||(r.state={}),r.context=$,r.__n=o,v=r.__d=!0,r.__h=[],r._sb=[]),r.__s==null&&(r.__s=r.state),x.getDerivedStateFromProps!=null&&(r.__s==r.state&&(r.__s=E({},r.__s)),E(r.__s,x.getDerivedStateFromProps(m,r.__s))),a=r.props,u=r.state,r.__v=e,v)x.getDerivedStateFromProps==null&&r.componentWillMount!=null&&r.componentWillMount(),r.componentDidMount!=null&&r.__h.push(r.componentDidMount);else{if(x.getDerivedStateFromProps==null&&m!==a&&r.componentWillReceiveProps!=null&&r.componentWillReceiveProps(m,$),!r.__e&&(r.shouldComponentUpdate!=null&&r.shouldComponentUpdate(m,r.__s,$)===!1||e.__v===_.__v)){for(e.__v!==_.__v&&(r.props=m,r.state=r.__s,r.__d=!1),e.__e=_.__e,e.__k=_.__k,e.__k.forEach(function(L){L&&(L.__=e)}),k=0;k<r._sb.length;k++)r.__h.push(r._sb[k]);r._sb=[],r.__h.length&&l.push(r);break e}r.componentWillUpdate!=null&&r.componentWillUpdate(m,r.__s,$),r.componentDidUpdate!=null&&r.__h.push(function(){r.componentDidUpdate(a,u,p)})}if(r.context=$,r.props=m,r.__P=t,r.__e=!1,b=f.__r,T=0,"prototype"in x&&x.prototype.render){for(r.state=r.__s,r.__d=!1,b&&b(e),d=r.render(r.props,r.state,r.context),S=0;S<r._sb.length;S++)r.__h.push(r._sb[S]);r._sb=[]}else do r.__d=!1,b&&b(e),d=r.render(r.props,r.state,r.context),r.state=r.__s;while(r.__d&&++T<25);r.state=r.__s,r.getChildContext!=null&&(o=E(E({},o),r.getChildContext())),v||r.getSnapshotBeforeUpdate==null||(p=r.getSnapshotBeforeUpdate(a,u)),ve(t,J(N=d!=null&&d.type===I&&d.key==null?d.props.children:d)?N:[N],e,_,o,i,n,l,c,s,h),r.base=e.__e,e.__h=null,r.__h.length&&l.push(r),H&&(r.__E=r.__=null)}catch(L){e.__v=null,s||n!=null?(e.__e=c,e.__h=!!s,n[n.indexOf(c)]=null):(e.__e=_.__e,e.__k=_.__k),f.__e(L,e,_)}else n==null&&e.__v===_.__v?(e.__k=_.__k,e.__e=_.__e):e.__e=Ee(_.__e,e,_,o,i,n,l,s,h);(d=f.diffed)&&d(e)}function ge(t,e,_){e.__d=void 0;for(var o=0;o<_.length;o++)K(_[o],_[++o],_[++o]);f.__c&&f.__c(e,t),t.some(function(i){try{t=i.__h,i.__h=[],t.some(function(n){n.call(i)})}catch(n){f.__e(n,i.__v)}})}function Ee(t,e,_,o,i,n,l,c,s){var h,d,r,v=_.props,a=e.props,u=e.type,p=0;if(u==="svg"&&(i=!0),n!=null){for(;p<n.length;p++)if((h=n[p])&&"setAttribute"in h==!!u&&(u?h.localName===u:h.nodeType===3)){t=h,n[p]=null;break}}if(t==null){if(u===null)return document.createTextNode(a);t=i?document.createElementNS("http://www.w3.org/2000/svg",u):document.createElement(u,a.is&&a),n=null,c=!1}if(u===null)v===a||c&&t.data===a||(t.data=a);else{if(n=n&&B.call(t.childNodes),d=(v=_.props||C).dangerouslySetInnerHTML,r=a.dangerouslySetInnerHTML,!c){if(n!=null)for(v={},p=0;p<t.attributes.length;p++)v[t.attributes[p].name]=t.attributes[p].value;(r||d)&&(r&&(d&&r.__html==d.__html||r.__html===t.innerHTML)||(t.innerHTML=r&&r.__html||""))}if(we(t,a,v,i,c),r)e.__k=[];else if(ve(t,J(p=e.props.children)?p:[p],e,_,o,i&&u!=="foreignObject",n,l,n?n[0]:_.__k&&D(_,0),c,s),n!=null)for(p=n.length;p--;)n[p]!=null&&de(n[p]);c||("value"in a&&(p=a.value)!==void 0&&(p!==t.value||u==="progress"&&!p||u==="option"&&p!==v.value)&&M(t,"value",p,v.value,!1),"checked"in a&&(p=a.checked)!==void 0&&p!==t.checked&&M(t,"checked",p,v.checked,!1))}return t}function K(t,e,_){try{typeof t=="function"?t(e):t.current=e}catch(o){f.__e(o,_)}}function q(t,e,_){var o,i;if(f.unmount&&f.unmount(t),(o=t.ref)&&(o.current&&o.current!==t.__e||K(o,null,e)),(o=t.__c)!=null){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(n){f.__e(n,e)}o.base=o.__P=null,t.__c=void 0}if(o=t.__k)for(i=0;i<o.length;i++)o[i]&&q(o[i],e,_||typeof t.type!="function");_||t.__e==null||de(t.__e),t.__=t.__e=t.__d=void 0}function Pe(t,e,_){return this.constructor(t,_)}function He(t,e,_){var o,i,n,l;f.__&&f.__(t,e),i=(o=typeof _=="function")?null:_&&_.__k||e.__k,n=[],l=[],G(e,t=(!o&&_||e).__k=$e(I,null,[t]),i||C,C,e.ownerSVGElement!==void 0,!o&&_?[_]:i?null:e.firstChild?B.call(e.childNodes):null,n,!o&&_?_:i?i.__e:e.firstChild,o,l),ge(n,t,l)}B=pe.slice,f={__e:function(t,e,_,o){for(var i,n,l;e=e.__;)if((i=e.__c)&&!i.__)try{if((n=i.constructor)&&n.getDerivedStateFromError!=null&&(i.setState(n.getDerivedStateFromError(t)),l=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(t,o||{}),l=i.__d),l)return i.__E=i}catch(c){t=c}throw t}},fe=0,A.prototype.setState=function(t,e){var _;_=this.__s!=null&&this.__s!==this.state?this.__s:this.__s=E({},this.state),typeof t=="function"&&(t=t(E({},_),this.props)),t&&E(_,t),t!=null&&this.__v&&(e&&this._sb.push(e),X(this))},A.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),X(this))},A.prototype.render=I,P=[],ae=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,V=function(t,e){return t.__v.__b-e.__v.__b},W.__r=0;var j,y,R,_e,Q=0,be=[],O=[],ne=f.__b,re=f.__r,oe=f.diffed,ie=f.__c,le=f.unmount;function Ne(t,e){f.__h&&f.__h(y,t,Q||e),Q=0;var _=y.__H||(y.__H={__:[],__h:[]});return t>=_.__.length&&_.__.push({__V:O}),_.__[t]}function se(t){return Q=1,Ce(ke,t)}function Ce(t,e,_){var o=Ne(j++,2);if(o.t=t,!o.__c&&(o.__=[_?_(e):ke(void 0,e),function(c){var s=o.__N?o.__N[0]:o.__[0],h=o.t(s,c);s!==h&&(o.__N=[h,o.__[1]],o.__c.setState({}))}],o.__c=y,!y.u)){var i=function(c,s,h){if(!o.__c.__H)return!0;var d=o.__c.__H.__.filter(function(v){return v.__c});if(d.every(function(v){return!v.__N}))return!n||n.call(this,c,s,h);var r=!1;return d.forEach(function(v){if(v.__N){var a=v.__[0];v.__=v.__N,v.__N=void 0,a!==v.__[0]&&(r=!0)}}),!(!r&&o.__c.props===c)&&(!n||n.call(this,c,s,h))};y.u=!0;var n=y.shouldComponentUpdate,l=y.componentWillUpdate;y.componentWillUpdate=function(c,s,h){if(this.__e){var d=n;n=void 0,i(c,s,h),n=d}l&&l.call(this,c,s,h)},y.shouldComponentUpdate=i}return o.__N||o.__}function Te(){for(var t;t=be.shift();)if(t.__P&&t.__H)try{t.__H.__h.forEach(F),t.__H.__h.forEach(z),t.__H.__h=[]}catch(e){t.__H.__h=[],f.__e(e,t.__v)}}f.__b=function(t){y=null,ne&&ne(t)},f.__r=function(t){re&&re(t),j=0;var e=(y=t.__c).__H;e&&(R===y?(e.__h=[],y.__h=[],e.__.forEach(function(_){_.__N&&(_.__=_.__N),_.__V=O,_.__N=_.i=void 0})):(e.__h.forEach(F),e.__h.forEach(z),e.__h=[],j=0)),R=y},f.diffed=function(t){oe&&oe(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(be.push(e)!==1&&_e===f.requestAnimationFrame||((_e=f.requestAnimationFrame)||De)(Te)),e.__H.__.forEach(function(_){_.i&&(_.__H=_.i),_.__V!==O&&(_.__=_.__V),_.i=void 0,_.__V=O})),R=y=null},f.__c=function(t,e){e.some(function(_){try{_.__h.forEach(F),_.__h=_.__h.filter(function(o){return!o.__||z(o)})}catch(o){e.some(function(i){i.__h&&(i.__h=[])}),e=[],f.__e(o,_.__v)}}),ie&&ie(t,e)},f.unmount=function(t){le&&le(t);var e,_=t.__c;_&&_.__H&&(_.__H.__.forEach(function(o){try{F(o)}catch(i){e=i}}),_.__H=void 0,e&&f.__e(e,_.__v))};var ce=typeof requestAnimationFrame=="function";function De(t){var e,_=function(){clearTimeout(o),ce&&cancelAnimationFrame(e),setTimeout(t)},o=setTimeout(_,100);ce&&(e=requestAnimationFrame(_))}function F(t){var e=y,_=t.__c;typeof _=="function"&&(t.__c=void 0,_()),y=e}function z(t){var e=y;t.__c=t.__(),y=e}function ke(t,e){return typeof e=="function"?e(t):e}let ue=/[a-zA-ZāáḏḍēġḥīōṭūʿʾĀḌḎĒĠṬḤĪŌŪʿʾ]/,Le=t=>{let e={};for(let _=0;_<t.length;_++){let o=t[_];for(let i=0;i<o.sources.length;i++){let n=o.sources[i],l=e;for(let c=0;c<n.length;c++){let s=n[c];l[s]||(l[s]={}),l=l[s]}l.isEndOfWord=!0,l.target=o.target,l.options=o.options||{}}}return e},Ue=(t,e,_,o,i)=>{if(_&&_.match==="whole")return!ue.test(t)&&!ue.test(e);if((_==null?void 0:_.match)==="alone")return/\s/.test(t)&&/\s/.test(e);if(_!=null&&_.prefix){let n=_.prefix.length,l=i-n;return l<0||o.slice(l,i)!==_.prefix}return!0},Ae=(t,e)=>{var i;let _="",o=0;for(;o<e.length;){let n=t,l=o,c=[];for(;n[e[l]]&&l<e.length;)n=n[e[l]],l++,n.isEndOfWord&&c.push({index:l-1,node:n});let s=null;for(let h=c.length-1;h>=0;h--){let{index:d,node:r}=c[h],v=e[o-1]||"",a=e[d+1]||"";if(Ue(v,a,r.options,e,o)){s=r,l=d+1;break}}if(s){if((i=s.options)!=null&&i.prefix){let h=s.options.prefix.length,d=o-h;d>=0&&e.slice(d,o)===s.options.prefix||(_+=s.options.prefix)}_+=s.target,o=l}else _+=e[o],o++}return _};const Oe="trie-rules-demo",Fe="@ragaeeb",We="0.0.1",Me="module",Be={dev:"vite",build:"vite build",preview:"vite preview",deploy:"gh-pages -d dist"},Ie={preact:"10.18.2","trie-rules":"1.0.3"},Re={"@preact/preset-vite":"2.6.0","gh-pages":"6.0.0",vite:"4.5.0"},Ve={name:Oe,author:Fe,private:!0,version:We,type:Me,scripts:Be,dependencies:Ie,devDependencies:Re};var qe=0;function w(t,e,_,o,i,n){var l,c,s={};for(c in e)c=="ref"?l=e[c]:s[c]=e[c];var h={type:t,props:s,key:_,ref:l,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:--qe,__i:-1,__source:i,__self:n};if(typeof t=="function"&&(l=t.defaultProps))for(c in l)s[c]===void 0&&(s[c]=l[c]);return f.vnode&&f.vnode(h),h}const je=JSON.stringify([{target:"Bukhārī",sources:["Bukhari","Bukhaaree"],options:{prefix:"al-",match:"whole"}},{target:"Qurʾān",sources:["Quran","Quraan"]}],null,2);function Qe(){const[t,e]=se(je),[_,o]=se("Bukhari and Muslim are the most authentic books we have after the Quran."),i=c=>{e(c.target.value)},n=c=>{o(c.target.value)},l=()=>{try{const c=JSON.parse(t),s=Le(c),h=Ae(s,_);o(h)}catch(c){alert("Error parsing rules or processing text: "+c.message)}};return w("div",{children:[w("h1",{children:["Trie-Rules v",Ve.dependencies["trie-rules"]," Demo"]}),w("div",{children:[w("textarea",{value:t,rows:"18",onChange:i,placeholder:"Enter rules in JSON format"}),w("br",{}),w("textarea",{value:_,style:{minWidth:"100%"},onChange:n,placeholder:"Enter text to format"}),w("button",{onClick:l,children:"Process Text"})]})]})}He(w(Qe,{}),document.getElementById("app"));
