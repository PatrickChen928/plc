(function(win) {
  let PageLifeCycleInfo = null;
  // 鼠标停留最长时间： 2分钟
  const MOUSE_MAX_STAY_TIME = 2 * 60 * 1000;
  let lastMouseMoveTime = Date.now();
  function queryParam(name) {
      const url = win.location.search; //获取url中"?"符后的字串
      const theRequest = {};
      if (url.indexOf("?") != -1) {
          const str = url.substr(1);
          const strs = str.split("&");
          for (let i = 0; i < strs.length; i++) {
              theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
          }
      }
      return name ? theRequest[name] : theRequest;
  }
  function generateUUID() {
      const s = [];
      const hexDigits = "0123456789abcdef";
      for (let i = 0; i < 36; i++) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";
      return s.join("") + '_' + Date.now();
  }
  function getStayDuration(childId) {
      updateDuration();
      if (childId) {
          return PageLifeCycleInfo.children[childId].stay_duration;
      }
      return PageLifeCycleInfo.stay_duration;
  }
  function getMouseSubTime() {
      const now = Date.now();
      return now - lastMouseMoveTime;
  }
  function updateDuration() {
      const now = Date.now();
      let subTime = getMouseSubTime();
      if (subTime < MOUSE_MAX_STAY_TIME) {
          subTime = 0;
      }
      console.log('[plc.js]: ' + 'subTime,' + subTime);
      const stay_duration = now - PageLifeCycleInfo.startTime + PageLifeCycleInfo.stay_duration - subTime;
      PageLifeCycleInfo.stay_duration = stay_duration;
      PageLifeCycleInfo.startTime = Date.now();
      for (let key in PageLifeCycleInfo.children) {
          let value = PageLifeCycleInfo.children[key];
          if (value.status === 1) {
              value.stay_duration = now - value.startTime + value.stay_duration - subTime;
              value.startTime = Date.now();
          }
      }
  }
  function updateStartTime() {
      PageLifeCycleInfo.startTime = Date.now();
      for (let key in PageLifeCycleInfo.children) {
          let value = PageLifeCycleInfo.children[key];
          value.startTime = Date.now();
      }
  }
  function getPlcId() {
      const id = PageLifeCycleInfo.id;
      updateDuration();
      cachePlc();
      return id;
  }
  function cachePlc(val) {
      // destory
      if (PageLifeCycleInfo === null) {
          return;
      }
      const key = PageLifeCycleInfo.page_uuid; 
      if (!key) {
          console.warn('[plc.js]: ' + '**not input page_uuid**');
          return;
      }
      const cacheValue = val != undefined ? val : JSON.stringify(PageLifeCycleInfo);
      win.localStorage.setItem(key, cacheValue);
  }
  function destoryPlc() {
      removeEventListenerAll();
      cachePlc('');
      PageLifeCycleInfo = null;
  }
  function generateChild() {
      return {
          startTime: Date.now(),
          stay_duration: 0,
          status: 1 // 1 0 
      }
  }
  function createChildLifeCycle(childId) {
      if (!childId) return;
      PageLifeCycleInfo.children[childId] = generateChild();
      // PageLifeCycleInfo.children[childId] = PageLifeCycleInfo.children[childId] || generateChild();
      // PageLifeCycleInfo.children[childId].startTime = Date.now();
      // PageLifeCycleInfo.children[childId].status = 1;
  }
  function stopChildLifeCycle(childId, clearDuration) {
      let childInfo = null;
      if (!childId || !(childInfo = PageLifeCycleInfo.children[childId])) return;
      if (clearDuration) {
          childInfo.stay_duration = 0;
      }
      childInfo.status = 0;
  }
  function focusCallback() {
      console.log('[plc.js]: ' + 'focus');
      PageLifeCycleInfo.status = 'on';
      lastMouseMoveTime = Date.now();
      updateStartTime();
      win.removeEventListener('mousemove', mousemoveCallback);
      win.addEventListener('mousemove', mousemoveCallback);
  }
  function blurCallback() {
      console.log('[plc.js]: ' + 'blur, duration: ', getStayDuration());
      PageLifeCycleInfo.status = 'off';
      lastMouseMoveTime = Date.now();
      win.removeEventListener('mousemove', mousemoveCallback);
      updateDuration();
  }
  function mousemoveCallback() {
      const now  = Date.now();
      let subTime = getMouseSubTime();
      if (subTime >= MOUSE_MAX_STAY_TIME) {
          updateDuration(subTime);
      }
      PageLifeCycleInfo.status = 'on';
      lastMouseMoveTime = now;
  }
  function visibilitychangeCallback() {
      const isHidden = document.hidden;
      lastMouseMoveTime = Date.now();
      if (isHidden) {
          updateDuration();
      } else {
          updateStartTime();
      }
  }
  function beforeunloadCallback() {
      if (PageLifeCycleInfo.autoDestory) {
          destoryPlc();
      } else {
          if (PageLifeCycleInfo.status === 'on') {
              updateDuration();
          }
          cachePlc();
      }
  }
  function addEventListenerAll() {
      win.addEventListener('focus', focusCallback);
      win.addEventListener('blur', blurCallback);
      win.addEventListener('mousemove', mousemoveCallback);
      win.addEventListener('visibilitychange', visibilitychangeCallback);
      win.addEventListener('beforeunload', beforeunloadCallback);
  }
  function removeEventListenerAll() {
      win.removeEventListener('focus', focusCallback);
      win.removeEventListener('blur', blurCallback);
      win.removeEventListener('mousemove', mousemoveCallback);
      win.removeEventListener('visibilitychange', visibilitychangeCallback);
      win.removeEventListener('beforeunload', beforeunloadCallback);
  }
  function pageInit(page_uuid, options) {
      PageLifeCycleInfo = {
          id: queryParam('_plcId_') || generateUUID(),
          startTime: Date.now(),
          stay_duration: 0,
          page_uuid: page_uuid || null,
          autoDestory: !!options.autoDestory,
          children: {},
          status: 'on', // on/off： 用于判断最后页面卸载时是否需要更新时间
      };
      addEventListenerAll();
  }
  win.plc = {
      init(page_uuid, options = {}) {
          const { useOldPlcId, autoDestory } = options;
          try {
              if (page_uuid) {
                  pageInit(page_uuid, options);
                  let oldPageInfo = win.localStorage.getItem(page_uuid);
                  // 复用缓存时间
                  if (oldPageInfo && !autoDestory) {
                      oldPageInfo = JSON.parse(oldPageInfo);
                      PageLifeCycleInfo.stay_duration = oldPageInfo.stay_duration || 0;
                      if (useOldPlcId) {
                          PageLifeCycleInfo.id = oldPageInfo.id;
                      }
                  }
              } else {
                  console.warn('[plc.js]: ' + '**not input pages uuid, this will cause stay_duration\'s accuracy**');
              }
          } catch (e) {
              console.log(e);
          }
      },
      getPlcId,
      getStayDuration,
      destoryPlc,
      createChildLifeCycle,
      stopChildLifeCycle
  };
})(window);