import React from 'react';

const SubletAppTest = () => {
  return (
    <div style={{ maxWidth: '28rem', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}>SubletHub Test</h1>
      </div>
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>App is working!</h2>
        <p style={{ color: '#4b5563' }}>If you can see this, the basic React setup is functioning.</p>
        <button onClick={() => alert('React is working!')} style={{ 
          backgroundColor: '#2563eb', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          border: 'none', 
          borderRadius: '0.5rem',
          marginTop: '1rem',
          cursor: 'pointer'
        }}>Test Button</button>
      </div>
    </div>
  );
};

export default SubletAppTest;