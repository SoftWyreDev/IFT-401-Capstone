const form = document.getElementById('create-stock');

form.onsubmit = async (e) => {
  e.preventDefault();

  const body = JSON.stringify(Object.fromEntries(new FormData(form).entries()));

  const token = localStorage.getItem('token');

  const res = await fetch('/.netlify/functions/create-stock', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  
    },
    body
  });

  if (res.ok) {
    const data = await res.json();
    alert(`Stock ${data.ticker} created!`);
  } else {
    alert(await res.text());
  }
};