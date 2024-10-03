type SectionContainerProps = {
  children: React.ReactNode
}

const SectionContainer = ({ children }: SectionContainerProps) => (
  <div className="mb-12">{children}</div>
)

export default SectionContainer
