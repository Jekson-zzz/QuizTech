(async () => {
  const url = 'http://localhost:3000/api/quiz/complete';
  const body = { userId: 8, score: 85, durationSeconds: 300, category: 'math' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  } catch (e) {
    console.error('request error', e);
    process.exit(1);
  }
})();
