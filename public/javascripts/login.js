document.querySelector('form').addEventListener('submit', function(evt) {
  evt.preventDefault();
  var form = evt.target ;
  var iscreate = form.classList.contains('creation') ;
  var els = document.querySelectorAll('[id^='+(iscreate ? 'create' : 'login' )+ '_]') ;
  var datas = {};
  for(var i in els) {
    if(els[i].name && els[i].value) {
      datas[els[i].name] = els[i].value ;
    }
  }
  fetch(form.getAttribute('action'), {
    method: iscreate ? 'post' : 'put',
    headers : {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(datas)
  }).then(function(r) {return r.json()})
    .then(function(response) {
      if(response.status) {
        document.location.reload();
      } else {
        alert(response.message || 'Une erreur est survenue') ;
      }
    })
  console.log(datas)
})
