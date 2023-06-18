function verifyInputs() {
    var inputs = document.querySelector('input');

    if (inputs.value == '') {
        return false;
    }
    else{
        alert('Mensaje enviado... presione aceptar para finalizar el envío.');
        return true;
    }

  }