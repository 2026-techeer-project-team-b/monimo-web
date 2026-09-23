import { IconBase, type IconProps } from './IconBase'

/** Figma `Icon/external-dashed` */
export function IconExternalDashed(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3H4C2.34315 3 1 4.34315 1 6V10C1 11.6569 2.34315 13 4 13H12C13.6569 13 15 11.6569 15 10V6C15 4.34315 13.6569 3 12 3Z" stroke-dasharray="3 2.5" />
    </IconBase>
  )
}
