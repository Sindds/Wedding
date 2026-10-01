import SpaceBackground from '@/components/sky/SpaceBackground'
import HeroSection from '@/components/HeroSection'
import DetailsSection from '@/components/DetailsSection'
import RsvpSection from '@/components/RsvpSection'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <SpaceBackground />
      <a href="#rsvp" className="skip-link">Перейти к форме ответа</a>
      <main id="main">
        <HeroSection />
        <div className="section-divider" aria-hidden="true" />
        <DetailsSection />
        <div className="section-divider" aria-hidden="true" />
        <RsvpSection />
      </main>
      <Footer />
    </>
  )
}
