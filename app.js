/* Replace these placeholders with real business links. WhatsApp should contain digits only. */
const BUSINESS_CONFIG = {
  whatsapp: 'YOUR_WHATSAPP_NUMBER',
  instagram: 'YOUR_INSTAGRAM_URL',
  facebook: 'YOUR_FACEBOOK_URL',
  tiktok: 'YOUR_TIKTOK_URL'
};

const ICONS = {
  painting: '<svg viewBox="0 0 32 32"><path d="M5 6h15a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M23 10h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-8v4"/><rect x="15" y="21" width="6" height="8" rx="1"/></svg>',
  masonry: '<svg viewBox="0 0 32 32"><path d="M3 7h26v18H3zM3 13h26M3 19h26M10 7v6m12-6v6M7 13v6m12-6v6m-9 0v6m12-6v6"/></svg>',
  structural: '<svg viewBox="0 0 32 32"><path d="M5 28V5h22v23M9 5v23m14-23v23M9 11h14M9 19h14M5 28h22"/></svg>'
};

const SERVICES = {
  painting: { title: 'Painting', summary: 'Interior, exterior and refined finishes.', description: 'Professional painting solutions for homes, offices, and commercial properties, completed with careful preparation and refined finishes.', items: ['Interior Painting','Exterior Painting','House Repainting','Commercial Painting','Roof Painting','Door and Window Painting','Waterproof Coating','Decorative and Texture Painting','Colour Consultation','Surface Preparation'] },
  masonry: { title: 'Masonry', summary: 'Construction, finishes and repairs.', description: 'Reliable masonry, construction, and renovation services for improving and repairing residential and commercial properties.', items: ['Brick and Block Work','Wall Construction','Wall Plastering','Cement Rendering','Floor Screeding','Tile Installation','Crack Repair','Concrete Repair','Boundary-Wall Construction','Renovation Work'] },
  structural: { title: 'Structural', summary: 'Assessment, strengthening and repairs.', description: 'Structural assessment and repair solutions designed to improve the stability, durability, and condition of buildings.', items: ['Structural Inspection','Foundation Repair','Concrete Reinforcement','Column and Beam Repair','Roof Structure Repair','Structural Crack Repair','Steel Structure Work','Building Extensions','Structural Strengthening','Damage Assessment'], note: 'Major structural work may require an assessment by a qualified structural professional.' }
};

const modal = document.querySelector('#service-modal');
const panel = modal.querySelector('.modal-panel');
const notice = document.querySelector('#notice');
let selectedService = '';
let previousFocus = null;

document.querySelector('#service-cards').innerHTML = Object.entries(SERVICES).map(([key, service]) => `
  <button class="service-card" type="button" data-service="${key}">
    <span class="service-icon" aria-hidden="true">${ICONS[key]}</span>
    <strong>${service.title}</strong><p>${service.summary}</p><small>Explore →</small>
  </button>`).join('');

function configured(value) { return value && !value.startsWith('YOUR_'); }
function closeModal() {
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  previousFocus?.focus();
}
function openModal(key, trigger) {
  const service = SERVICES[key];
  selectedService = key;
  previousFocus = trigger;
  document.querySelector('#modal-icon').innerHTML = ICONS[key];
  document.querySelector('#modal-title').textContent = service.title;
  document.querySelector('#modal-description').textContent = service.description;
  document.querySelector('#modal-services').innerHTML = service.items.map(item => `<li>${item}</li>`).join('');
  document.querySelector('#modal-note').textContent = service.note || '';
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-x').focus();
}

document.querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => openModal(card.dataset.service, card)));
modal.querySelector('.modal-x').addEventListener('click', closeModal);
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
modal.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
  if (event.key !== 'Tab') return;
  const controls = [...panel.querySelectorAll('button')];
  if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
  if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
});

const LIMITS = { maxImages: 6, maxImageMB: 8, maxVideoMB: 50, maxDescription: 1200 };
const consultModal = document.querySelector('#consult-modal');
const consultPanel = consultModal.querySelector('.consult-panel');
const consultContent = document.querySelector('#consult-content');
const consultStatus = document.querySelector('#consult-status');
const state = { type: '', step: 0, data: {}, images: [], video: null, audio: null, audioUrl: '', imageUrls: [], surfaces: [] };
let recorder = null, stream = null, timer = null, seconds = 0;

function field(name, label, type = 'text', required = true, extra = '') {
  const value = state.data[name] || '';
  return `<label class="field">${label}${required ? ' *' : ''}<input name="${name}" type="${type}" value="${value}" ${required ? 'required' : ''} ${extra}><span class="field-error"></span></label>`;
}
function serviceOptions() { return SERVICES[selectedService].items.map(x => `<option ${state.data.service === x ? 'selected' : ''}>${x}</option>`).join(''); }
function propertyOptions() { return ['House','Apartment','Office','Commercial building','Other'].map(x => `<option ${state.data.property === x ? 'selected' : ''}>${x}</option>`).join(''); }
function progress(total, current) { document.querySelector('#progress').innerHTML = Array.from({length: total}, (_, i) => `<span class="${i <= current ? 'active' : ''}"></span>`).join(''); }
function saveForm() { const form = consultContent.querySelector('form'); if (form) Object.assign(state.data, Object.fromEntries(new FormData(form))); }
function validForm() { const form = consultContent.querySelector('form'); if (!form) return true; if (!form.checkValidity()) { form.reportValidity(); consultStatus.textContent = 'Please complete the required fields correctly.'; return false; } saveForm(); return true; }
function stepButtons(back = true, next = 'Continue') { return `<div class="step-actions">${back ? '<button class="button" type="button" data-back>Back</button>' : '<span></span>'}<button class="button gold" type="submit">${next}</button></div>`; }
function renderOptions() {
  state.step = 0; progress(1, 0); document.querySelector('#consult-title').textContent = 'Request Consultation';
  consultContent.innerHTML = `<div class="option-grid"><button class="option-card" data-type="onsite"><span class="service-icon">⌂</span><h3>On-site Consultation</h3><p>Schedule a visit so our team can inspect the property, discuss your requirements, and prepare an appropriate quotation.</p><strong>Book a Visit →</strong></button><button class="option-card" data-type="online"><span class="service-icon">▣</span><h3>Online Consultation</h3><p>Send photos, videos, measurements, and a voice or text explanation so we can review your requirements remotely.</p><strong>Start Online Consultation →</strong></button></div><div class="step-actions"><button class="button" data-back-service>Back</button></div>`;
  consultContent.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { state.type = b.dataset.type; state.step = 1; renderConsult(); });
  consultContent.querySelector('[data-back-service]').onclick = () => { closeConsult(false); openModal(selectedService, previousFocus); };
  consultContent.querySelector('[data-type]').focus();
}
function commonFields(includeEmail = false) {
  return `<p>Selected category: <span class="readonly">${SERVICES[selectedService].title}</span></p><div class="form-grid"><label class="field">Specific required service *<select name="service" required><option value="">Choose a service</option>${serviceOptions()}</select></label>${field('name','Full name')}${field('phone','Phone or WhatsApp number','tel',true,'pattern="[+0-9 ()-]{7,20}"')}${includeEmail ? field('email','Email','email',false) : ''}<label class="field">Property type *<select name="property" required><option value="">Choose property type</option>${propertyOptions()}</select></label>`;
}
function renderOnsite() {
  progress(1, 0); const today = new Date().toISOString().split('T')[0];
  consultContent.innerHTML = `<form>${commonFields()}${field('address','Property address')} ${field('date','Preferred visit date','date',true,`min="${today}"`)}<label class="field">Preferred period *<select name="period" required><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label><label class="field full">Short description *<textarea name="description" required>${state.data.description || ''}</textarea></label><label class="field full"><span><input type="checkbox" name="consent" required> I consent to being contacted about this request. *</span></label></div>${stepButtons(true,'Submit Visit Request')}</form>`;
  consultContent.querySelector('[data-back]').onclick = () => { saveForm(); renderOptions(); };
  consultContent.querySelector('form').onsubmit = e => { e.preventDefault(); if (validForm()) submitSummary(); };
}
function renderOnlineDetails() {
  consultContent.innerHTML = `<form>${commonFields(true)}${field('location','Property location')}</div>${stepButtons()}</form>`;
  consultContent.querySelector('[data-back]').onclick = () => { saveForm(); renderOptions(); }; consultContent.querySelector('form').onsubmit = e => { e.preventDefault(); if(validForm()){state.step=2;renderConsult();} };
}
function fileSize(file) { return `${(file.size / 1048576).toFixed(1)} MB`; }
function clearImageUrls() { state.imageUrls.forEach(URL.revokeObjectURL); state.imageUrls = []; }
function renderFiles() { clearImageUrls(); const list = document.querySelector('#file-list'); if (!list) return; list.innerHTML = state.images.map((f,i) => { const u=URL.createObjectURL(f); state.imageUrls.push(u); return `<div class="file-item"><img src="${u}" alt="Preview"><span>${f.name}<br>${fileSize(f)}</span><button class="plain-button" data-remove-image="${i}" aria-label="Remove ${f.name}">Remove</button></div>`; }).join('') + (state.video ? `<div class="file-item"><span>Video: ${state.video.name} (${fileSize(state.video)})</span><button class="plain-button" data-remove-video>Remove</button></div>` : ''); document.querySelectorAll('[data-remove-image]').forEach(b=>b.onclick=()=>{state.images.splice(+b.dataset.removeImage,1);renderFiles()}); document.querySelector('[data-remove-video]')?.addEventListener('click',()=>{state.video=null;renderFiles()}); }
function renderMedia() {
  consultContent.innerHTML = `<p class="help">Up to ${LIMITS.maxImages} JPG, PNG or WebP photos (${LIMITS.maxImageMB} MB each) and one optional video (${LIMITS.maxVideoMB} MB). Files remain on this device until you choose to continue.</p><div class="media-tools"><label class="button">Choose Photos<input class="file-input" id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><label class="button">Take Photo<input class="file-input" id="camera" type="file" accept="image/*" capture="environment"></label><label class="button">Choose Video<input class="file-input" id="video" type="file" accept="video/*"></label></div><div class="file-list" id="file-list"></div>${stepButtons()}`;
  const addImages=files=>{for(const f of files){if(state.images.length>=LIMITS.maxImages){consultStatus.textContent=`Maximum ${LIMITS.maxImages} photos.`;break}if(f.size<=LIMITS.maxImageMB*1048576)state.images.push(f);else consultStatus.textContent=`${f.name} exceeds ${LIMITS.maxImageMB} MB.`}renderFiles()}; document.querySelector('#photos').onchange=e=>addImages(e.target.files);document.querySelector('#camera').onchange=e=>addImages(e.target.files);document.querySelector('#video').onchange=e=>{const f=e.target.files[0];if(f&&f.size<=LIMITS.maxVideoMB*1048576)state.video=f;else consultStatus.textContent=`Video must be under ${LIMITS.maxVideoMB} MB.`;renderFiles()};renderFiles();consultContent.querySelector('[data-back]').onclick=()=>{state.step=1;renderConsult()};consultContent.querySelector('[type=submit]').onclick=()=>{state.step=3;renderConsult()};
}
function stopRecordingTracks(){stream?.getTracks().forEach(t=>t.stop());stream=null;clearInterval(timer);timer=null;}
async function startRecording(){if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){consultStatus.textContent='Voice recording is not supported by this browser.';return}try{stream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{state.audio=new Blob(chunks,{type:recorder.mimeType});if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl=URL.createObjectURL(state.audio);stopRecordingTracks();renderDescription()};recorder.start();seconds=0;timer=setInterval(()=>{seconds++;document.querySelector('#record-time').textContent=`Recording ${seconds}s`;},1000);renderDescription();}catch{consultStatus.textContent='Microphone permission was denied or unavailable.'}}
function renderDescription(){consultContent.innerHTML=`<label class="field">Describe the work<textarea id="work-text" maxlength="${LIMITS.maxDescription}" placeholder="Example: repaint two bedrooms and repair peeling paint…">${state.data.workText||''}</textarea><span class="counter" id="counter"></span></label><div class="recording-row">${recorder?.state==='recording'?'<button class="button" id="stop-record">Stop Recording</button><span id="record-time" aria-live="polite">Recording…</span>':'<button class="button" id="start-record">Start Recording</button>'}${state.audio?`<audio controls src="${state.audioUrl}"></audio><button class="plain-button" id="delete-record">Delete recording</button>`:''}</div><div class="info-panel">Use text, a voice recording, or both. Microphone permission is requested only when recording starts.</div>${stepButtons()}`;const t=document.querySelector('#work-text'),c=document.querySelector('#counter');const count=()=>c.textContent=`${t.value.length}/${LIMITS.maxDescription}`;t.oninput=count;count();document.querySelector('#start-record')?.addEventListener('click',startRecording);document.querySelector('#stop-record')?.addEventListener('click',()=>recorder.stop());document.querySelector('#delete-record')?.addEventListener('click',()=>{URL.revokeObjectURL(state.audioUrl);state.audio=null;state.audioUrl='';renderDescription()});consultContent.querySelector('[data-back]').onclick=()=>{state.data.workText=t.value;state.step=2;renderConsult()};consultContent.querySelector('[type=submit]').onclick=()=>{state.data.workText=t.value;if(!t.value.trim()&&!state.audio){consultStatus.textContent='Add a text description or voice recording before continuing.';return}state.step=4;renderConsult()};}
function surfaceRow(s={},i){return `<div class="surface" data-surface="${i}"><div class="surface-grid"><input aria-label="Surface name" placeholder="Surface name" value="${s.name||''}"><input type="number" min="0" step=".01" aria-label="Width" placeholder="Width" value="${s.width||''}"><input type="number" min="0" step=".01" aria-label="Height" placeholder="Height" value="${s.height||''}"><select aria-label="Unit"><option>Feet</option><option ${s.unit==='Metres'?'selected':''}>Metres</option></select><input type="number" min="0" aria-label="Doors" placeholder="Doors" value="${s.doors||''}"><input type="number" min="0" aria-label="Windows" placeholder="Windows" value="${s.windows||''}"></div><input type="number" min="0" step=".01" aria-label="Total opening area" placeholder="Optional total door/window area" value="${s.openings||''}"><input aria-label="Surface notes" placeholder="Notes" value="${s.notes||''}"><p class="area-result"></p><button class="plain-button" data-remove-surface>Remove surface</button></div>`}
function readSurfaces(){state.surfaces=[...document.querySelectorAll('.surface')].map(x=>{const [name,width,height,unit,doors,windows]=x.querySelectorAll('.surface-grid input,.surface-grid select');const [openings,notes]=x.querySelectorAll(':scope > input');return{name:name.value,width:width.value,height:height.value,unit:unit.value,doors:doors.value,windows:windows.value,openings:openings.value,notes:notes.value}})}
function calculateAreas(){document.querySelectorAll('.surface').forEach(x=>{const [n,w,h,u]=x.querySelectorAll('.surface-grid input,.surface-grid select'),opening=x.querySelector(':scope > input');const gross=(+w.value||0)*(+h.value||0),paint=Math.max(0,gross-(+opening.value||0));x.querySelector('.area-result').textContent=`Gross: ${gross.toFixed(2)} sq ${u.value} · Paintable: ${paint.toFixed(2)} sq ${u.value}`})}
function renderMeasurements(){consultContent.innerHTML=`<div class="info-panel">Camera measurement is not available in this version. Please enter approximate measurements manually. Advanced AR measurement may be introduced later for supported devices.</div><div id="surfaces">${state.surfaces.map(surfaceRow).join('')}</div><button class="button" id="add-surface">Add another surface</button><p class="help">These measurements are customer-provided estimates. Final dimensions, material quantities, prices, and structural requirements must be confirmed by Odan Painting Solutions.</p>${stepButtons()}`;const wire=()=>{document.querySelectorAll('.surface input,.surface select').forEach(x=>x.oninput=calculateAreas);document.querySelectorAll('[data-remove-surface]').forEach(b=>b.onclick=()=>{readSurfaces();state.surfaces.splice(+b.closest('.surface').dataset.surface,1);renderMeasurements()});calculateAreas()};document.querySelector('#add-surface').onclick=()=>{readSurfaces();state.surfaces.push({});renderMeasurements()};consultContent.querySelector('[data-back]').onclick=()=>{readSurfaces();state.step=3;renderConsult()};consultContent.querySelector('[type=submit]').onclick=()=>{readSurfaces();state.step=5;renderConsult()};wire();}
function summary(){const totals={};state.surfaces.forEach(s=>{const a=Math.max(0,(+s.width||0)*(+s.height||0)-(+s.openings||0));totals[s.unit]=(totals[s.unit]||0)+a});return `Consultation: ${state.type==='onsite'?'On-site':'Online'}\nCategory: ${SERVICES[selectedService].title}\nService: ${state.data.service}\nName: ${state.data.name}\nPhone: ${state.data.phone}\nProperty: ${state.data.property}\nLocation: ${state.data.location||state.data.address||''}\nPhotos: ${state.images.length}\nVideo: ${state.video?'Yes':'No'}\nVoice recording: ${state.audio?'Yes':'No'}\nDescription: ${state.data.workText||state.data.description||''}\nMeasurements: ${Object.entries(totals).map(([u,a])=>`${a.toFixed(2)} sq ${u}`).join(', ')||'None'}`}
function renderReview(){progress(5,4);consultContent.innerHTML=`<div class="review-box">${summary()}</div><label class="field"><span><input id="review-consent" type="checkbox"> I consent to being contacted about this request. *</span></label>${stepButtons(true,'Submit Request')}`;consultContent.querySelector('[data-back]').onclick=()=>{state.step=4;renderConsult()};consultContent.querySelector('[type=submit]').onclick=()=>{if(!document.querySelector('#review-consent').checked){consultStatus.textContent='Please provide consent before submitting.';return}submitSummary()};}
function submitSummary(){const button=consultContent.querySelector('[type=submit]');if(button)button.disabled=true;if(!configured(BUSINESS_CONFIG.whatsapp)){consultStatus.textContent='Your summary is ready, but WhatsApp is not configured. Set BUSINESS_CONFIG.whatsapp in app.js.';if(button)button.disabled=false;return}consultStatus.textContent='Your request summary is ready. WhatsApp will open next; please attach your selected photos, video, or voice recording there.';/* Future backend integration: send FormData containing state and media here. */setTimeout(()=>{window.open(`https://wa.me/${BUSINESS_CONFIG.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(summary()+'\nPlease attach selected media manually in WhatsApp.')}`,'_blank','noopener,noreferrer');if(button)button.disabled=false},500)}
function renderConsult(){consultStatus.textContent='';document.querySelector('#consult-subtitle').textContent=`${SERVICES[selectedService].title} services`;if(state.type==='onsite')renderOnsite();else [renderOptions,renderOnlineDetails,renderMedia,renderDescription,renderMeasurements,renderReview][state.step]?.();consultPanel.querySelector('input,select,textarea,button')?.focus()}
function closeConsult(reset=false){stopRecordingTracks();consultModal.classList.remove('open');document.body.classList.remove('modal-open');if(reset){clearImageUrls();if(state.audioUrl)URL.revokeObjectURL(state.audioUrl)}previousFocus?.focus()}
document.querySelector('#quote-button').addEventListener('click',()=>{modal.classList.remove('open');state.type='';state.step=0;consultModal.classList.add('open');document.body.classList.add('modal-open');renderOptions()});consultModal.querySelector('.modal-x').onclick=()=>closeConsult();consultModal.onclick=e=>{if(e.target===consultModal)closeConsult()};consultModal.onkeydown=e=>{if(e.key==='Escape')closeConsult();if(e.key==='Tab'){const f=[...consultPanel.querySelectorAll('button,input,select,textarea')].filter(x=>!x.disabled);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus()}}};

document.querySelectorAll('[data-social]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const key = link.dataset.social;
  const value = BUSINESS_CONFIG[key];
  if (!configured(value)) {
    notice.textContent = `Configure the ${key} link in BUSINESS_CONFIG inside app.js.`;
    return;
  }
  const url = key === 'whatsapp' ? `https://wa.me/${value.replace(/\D/g, '')}` : value;
  window.open(url, '_blank', 'noopener,noreferrer');
}));
