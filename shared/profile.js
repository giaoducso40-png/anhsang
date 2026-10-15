(function () {
  'use strict';
  function readObject(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (error) { return null; }
  }
  function clean(value) { return typeof value === 'string' ? value.trim() : ''; }
  window.KHTNProfile = {
    read: function () {
      const stored = readObject('studentInfo') || readObject('khtn9_anh_sang_studentInfo');
      const profile = readObject('khtn9_anh_sang_user_profile');
      const params = new URLSearchParams(location.search);
      if (params.get('role') === 'teacher' || (!params.has('role') && profile && profile.role === 'teacher')) {
        return { name: '', class: '', school: '' };
      }
      const source = stored || (profile && profile.role === 'student' ? profile : {}) || {};
      return {
        name: clean(params.get('name') || source.name),
        class: clean(params.get('class') || source.class),
        school: clean(params.get('school') || source.school)
      };
    }
  };
})();
