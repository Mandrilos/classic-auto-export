export default function Footer() {
  return (
    <footer className="border-t border-[#1e1e1e] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="text-[#e8e8e8] font-semibold text-sm tracking-wide mb-1">
              CLASSIC AUTO <span className="text-gold-400">EXPORT</span>
            </div>
            <p className="text-[#555] text-sm mt-3 leading-relaxed">
              Connecting classic car enthusiasts worldwide with exceptional vehicles
              and seamless export services.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-[#555] hover:text-gold-400 transition-colors">
                  Browse Catalog
                </a>
              </li>
              <li>
                <a href="mailto:info@classicautoexport.com" className="text-sm text-[#555] hover:text-gold-400 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="text-sm text-[#555]">
                <a href="mailto:info@classicautoexport.com" className="hover:text-gold-400 transition-colors">
                  info@classicautoexport.com
                </a>
              </li>
              <li className="text-sm text-[#555]">International buyers welcome</li>
            </ul>
          </div>
        </div>

        <div className="divider mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#444]">
            © {new Date().getFullYear()} Classic Auto Export. All rights reserved.
          </p>
          <p className="text-xs text-[#444]">All prices in EUR · Export documentation available</p>
        </div>
      </div>
    </footer>
  )
}
