import { getSiteSettings } from "@/lib/settings";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="hidden border-t border-gray-200 bg-white py-6 md:block">
      <div className="mx-auto max-w-7xl space-y-1 px-4 text-center text-sm text-gray-500">
        <p className="font-medium text-gray-700">{settings.familyName}</p>
        {(settings.ancestralHome || settings.address) && (
          <p>
            {settings.ancestralHome}
            {settings.ancestralHome && settings.address && " — "}
            {settings.address}
          </p>
        )}
        {settings.contactPhone && <p>Liên hệ: {settings.contactPhone}</p>}
      </div>
    </footer>
  );
}
