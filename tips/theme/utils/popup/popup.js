window.onload = function(){
  var popuplists = document.getElementsByClassName("popup");
  for(let i=0; i<popuplists.length; i++){
    let e = popuplists[i];
    let id = e.id;
    let e_s = document.getElementById(id + "-show")
    if (e_s != null){
      e.innerHTML = `<div class="popup-inner"><div class="close-btn"><i class="fas fa-times"></i></div>` + e.innerHTML + `</div><div class="black-background"></div>`
      addPopupEvent(id);
      // ページ読み込み時に表示させるかどうか。
      // document.getElementById(id + "-show")
    }
  }

  function addPopupEvent(id){
    var t = document.getElementById(id);      
    function togglePopUp(e) {
      if (e){
        e.addEventListener('click', function() {
          t.classList.toggle('is-show');
        });
      }
    }
    togglePopUp(t.querySelector(".black-background"));
    togglePopUp(t.querySelector(".close-btn"));
    togglePopUp(document.getElementById(id + "-show"));
  }
};