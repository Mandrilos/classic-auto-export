export default function SoldStamp() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className="border-[3px] border-red-600 rounded-sm px-5 py-2 opacity-90"
        style={{
          transform: 'rotate(-22deg)',
          boxShadow: 'inset 0 0 0 2px #dc2626',
        }}
      >
        <span
          className="block text-red-600 font-black text-3xl leading-none select-none"
          style={{ letterSpacing: '0.3em' }}
        >
          SOLD
        </span>
      </div>
    </div>
  )
}
