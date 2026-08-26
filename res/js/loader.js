window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main');

  setTimeout(() => {
    loader.style.opacity = '0';
    
    main.style.display = 'block';
    setTimeout(() => {
      main.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      loader.remove();
    }, 500);
    
  }, 1000); 
});
