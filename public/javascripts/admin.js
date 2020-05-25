document.getElementById('userName').addEventListener('click', function(evt) {

})
document.getElementById('logout').addEventListener('click', function(evt) {
  fetch('/users', {
    method: 'delete',
    headers : {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  }).then(function(r) {return r.json()})
    .then(function(response) {
      if(response.status) {
        document.location.href = '/admin';
      } else {
        alert(response.message || 'Une erreur est survenue') ;
      }
    })
})
const deleteFlipbook = function(id) {
  fetch('/admin/'+id, {
    method: 'delete',
    headers : {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  }).then(function(r) {return r.json()})
    .then(function(response) {
      if(response.status) {
        document.location.href = '/admin';
      } else {
        alert(response.message || 'Une erreur est survenue') ;
      }
    })
}
const editFlipbook = function(id) {
  fetch('/admin/'+id, {
    method: 'get',
    headers : {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  }).then(function(r) {return r.json()})
    .then(function(response) {
      if(response.status) {
        var form = document.getElementById('updateFlipbook').querySelector('form') ;
        form.querySelector('[name=id]').value = id ;
        form.querySelector('[name=name]').value = response.datas.name;
        form.querySelector('[name=description]').value = response.datas.description;
        $('#updateFlipbook').modal({show:true});
      } else {
        alert(response.message || 'Une erreur est survenue') ;
      }
    })
}
const flipbookEdition = function(evt) {
  evt.preventDefault();
  var form = evt.target ;
  var id = form.querySelector('[name=id]').value ;
  var name = form.querySelector('[name=name]').value ;
  var description = form.querySelector('[name=description]').value ;

  fetch('/admin/'+id, {
    method: 'put',
    headers : {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body : JSON.stringify({
      name:name,
      description:description,
    })
  }).then(function(r) {return r.json()})
    .then(function(response) {
      if(response.status) {
        document.location.href = '/admin';
      } else {
        alert(response.message || 'Une erreur est survenue') ;
      }
    })
}
