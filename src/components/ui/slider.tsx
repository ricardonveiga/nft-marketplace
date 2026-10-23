import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbs = props.value ?? props.defaultValue ?? [0]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex h-[15px] w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-0.5 grow bg-primary/40">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={index === 0 ? "Preço mínimo" : "Preço máximo"}
          className="block size-[15px] rounded-full border-2 border-background bg-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
