(async () => {
  const url = 'http://localhost:3000/api/quiz/complete';
  const body = {
    userId: 8,
    score: 90,
    durationSeconds: 120,
    category: '1',
    final: true,
    details: [
      { id: 1001, options: [{ id: 5001 }, { id: 5002 }], selected: 0, correct: true },
      { id: 1002, options: [{ id: 5003 }, { id: 5004 }], selected: 1, correct: false }
    ]
  };
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
