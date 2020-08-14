$(function(){
  let tags = [];
  let tagFilters = [];
  let searchPhrase = '';
  let $add = $('#add');
  let $cancelAdd = $('#cancel');
  let $modalBackground = $('#modal-background');
  let $modalAdd = $('#contact-modal');
  let $modalEdit = $('#edit-modal');
  let $contactForm = $('#contact-form');
  let $contactContainer = $('#contacts');
  let $tagdiv = $('#tagdiv');
  let $tagcontainer = $('#tagcontainer');
  let contactTemplate = Handlebars.compile($('#contactTemplate').html());
  let tagTemplate = Handlebars.compile($('#tagTemplate').html());
  let contactFormTemplate = Handlebars.compile($('#contactFormTemplate').html())
  let $tagForm = $('#tagform');
  let $editForm = $('#edit-form');
  let $search = $('#search');

  function renderContacts(tagArray, searchPhrase){
    $contactContainer.empty();
    $.ajax('http://localhost:3000/api/contacts/', {
      method:'get',
    }).done(function(json){
      json.forEach((contact, index)=> {
        if (json[index].tags) {
          json[index].tags = json[index].tags.split(',');
        }
      })
      let filteredJson = json.filter(function(contact){
        let isTagged = tagFilters.every(tag => {
          if (contact.tags){
            return contact.tags.includes(tag);
          } else {
            return false;
          }
        });

        let isNamed = contact.full_name.toLowerCase().includes(searchPhrase.toLowerCase());
        return isTagged && isNamed;

      })
      $contactContainer.append(contactTemplate({contacts:filteredJson}));
    })
  };

  function renderTags(){
    $tagcontainer.empty();
    $tagcontainer.append(tagTemplate({tags: tags}))
  }

  function populateTags(){
    $.ajax('http://localhost:3000/api/contacts/', {
      method:'get',
    }).done(function(json){
      json.forEach((contact, index)=> {
        if (json[index].tags) {
          json[index].tags.split(',').forEach(tag => {
            if (tags.indexOf(tag) === -1){
              tags.push(tag);
            }
          })
        }
      })
      renderTags();
    })
  };
  populateTags();
  renderContacts(tagFilters, searchPhrase);

  $add.on('click', function(e){
    e.preventDefault();
    $contactForm.empty();
    $contactForm.append(contactFormTemplate({tags:tags}));
    $modalBackground.fadeToggle();
    $modalAdd.fadeToggle();
  });

  $contactForm.on('click', '.cancel', function(e) {
    e.preventDefault();
    $modalBackground.fadeToggle();
    $modalAdd.fadeToggle();
  });

  $contactForm.on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    var formData = $contactForm.serializeArray();
    var json = {};

    let selectedTags = [];
    formData.forEach(function(data){
      if (data.name === 'tagchoice'){
        selectedTags.push(data.value);
      } else {
        json[data.name] = data.value;
      }
    });

    json.tags = selectedTags.join(',');

    $.ajax('http://localhost:3000/api/contacts/',{
      method: 'POST',
      data: JSON.stringify(json),
      headers: {
        'Content-type':'application/json',
      },
    }).done(function(){
      $modalBackground.fadeToggle();
      $modalAdd.fadeToggle();
      json.tags = selectedTags;
      $contactContainer.append(contactTemplate({contacts:[json]}))
    })
  });

  $tagForm.on('submit', function(e){
    e.preventDefault();
    let newtag = $tagForm.find('input[type="text"]').val();
    if (newtag && tags.indexOf(newtag) === -1){
      tags.push(newtag);
      renderTags();
      $tagForm[0].reset();
    };
  });

  $('#contacts').on('click', '.deletebutton', function(e){
    e.preventDefault();

    if(window.confirm("Do you really want to delete this?")) {
      let $parentDiv = $(this).parent();
      $.ajax(this.href, {method:'delete'}).done(function(){
        $parentDiv.remove();
      });
    }
  });

  $('#contacts').on('click', '.editbutton', function(e){
    e.preventDefault();
    let path = this.href;
    $.ajax(path).done(function(json){
      $editForm.empty();
      let selectedTags = json.tags === null ? [] : json.tags.split(',');
      json.tags = tags;
      $editForm.append(contactFormTemplate(json));
      $editForm.find(':checkbox').each(function(_,checkbox){
        if (selectedTags.includes($(checkbox).val())){
          $(checkbox).prop('checked', true);
        }
      })

      $modalBackground.fadeToggle();
      $modalEdit.fadeToggle();
    })

  });

  $editForm.on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    var formData = $editForm.serializeArray();
    var json = {};

    let selectedTags = [];
    formData.forEach(function(data){
      if (data.name === 'tagchoice'){
        selectedTags.push(data.value);
      } else {
        json[data.name] = data.value;
      }
    });

    json.tags = selectedTags.join(',');
    var id = $(this).find('dl').data('id');

    json.id = id;
    $.ajax(`http://localhost:3000/api/contacts/${id}`,{
      method: 'PUT',
      data: JSON.stringify(json),
      headers: {
        'Content-type':'application/json',
      },
    }).done(function(){
      $modalBackground.fadeToggle();
      $modalEdit.fadeToggle();
      renderContacts(tagFilters, searchPhrase);
    })
  });

  $editForm.on('click', '.cancel', function(e) {
    e.preventDefault();
    $modalBackground.fadeToggle();
    $modalEdit.fadeToggle();
  });

  $tagcontainer.on('click', '.tagbutton', function(e) {
    e.preventDefault();
    $(this).toggleClass('selected');
    tagFilters = $(this).parent().find('.selected').map((_,ele)=>ele.innerHTML).get();
    renderContacts(tagFilters, searchPhrase);
  });

  $search.on('keyup', function(e){
    e.stopPropagation();
    searchPhrase = $(this).val();
    renderContacts(tagFilters, searchPhrase);
  })


})
