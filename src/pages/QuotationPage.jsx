// Quotation Generator – dibungkus iframe supaya CSS print-exactnya tidak
// bentrok dengan Tailwind. File statis ada di public/quotation/.
export default function QuotationPage() {
  return (
    <div className="fixed inset-0 left-[72px] lg:left-[240px]">
      <iframe
        src="/quotation/index.html"
        title="Quotation Generator"
        className="w-full h-full border-0"
      />
    </div>
  )
}
