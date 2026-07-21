export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black tracking-tight text-red-600">BNK</span>
        <div className="leading-tight">
          <div className="text-xs font-semibold text-neutral-500">Commercial Bank</div>
        </div>
        <span className="ml-4 border-l border-black/10 pl-4 text-lg font-bold tracking-wide text-neutral-900">
          SERVER INVENTORY
        </span>
      </div>
      <nav className="flex items-center gap-5 text-sm font-medium text-neutral-600">
        <a href={process.env.NEXT_PUBLIC_ZABBIX_URL ?? "#"} className="hover:text-red-600">
          ZABBIX
        </a>
        <a href="/admin" className="hover:text-red-600">
          ADMIN
        </a>
      </nav>
    </header>
  );
}
