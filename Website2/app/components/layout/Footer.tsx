import { Link } from "react-router";

const FOOTER_LINKS = {
  Shop: ["/deals", "/cart", "/checkout"],
  Support: ["/help", "/returns", "/contact", "/report-problem"],
  Company: ["/about", "/careers", "/privacy", "/terms"],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-nile-heading text-white mt-auto">
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-nile-green-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">NF</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">NILE FLOW</h3>
                <p className="text-gray-400 text-sm">Premium African Marketplace</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your gateway to authentic African products. Premium quality, fair
              prices, and seamless delivery across the continent.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, paths]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {paths.map((path) => {
                  const label = path
                    .replace(/^\//, "")
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className="text-gray-400 hover:text-nile-green-400 text-sm transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {year} Nile Flow. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
