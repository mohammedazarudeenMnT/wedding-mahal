import Image from "next/image";

export default function PolicyLayout({ children, title, logoPath }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        {logoPath && (
          <div className="mb-4">
            <Image
              src={logoPath}
              alt="Logo"
              width={150}
              height={50}
              className="mx-auto"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
      </div>
      <div className="prose max-w-none">{children}</div>
    </div>
  );
}
