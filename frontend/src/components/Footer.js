// components/Footer.js
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          © {new Date().getFullYear()} BidFront — Winnebago County, IL Construction Lead Aggregator.
          {' '}Data sourced from public government bid portals.
        </p>
        <p style={{ marginTop: 8 }}>
          <a href="https://www.wincoil.us" target="_blank" rel="noopener noreferrer">Winnebago County Purchasing</a>
          {' · '}
          <a href="https://www.rockfordil.gov" target="_blank" rel="noopener noreferrer">City of Rockford</a>
        </p>
      </div>
    </footer>
  );
}
