import SiteLayout from "./(site)/layout";
import NotFoundBody from "./(site)/not-found";

/** Unknown routes render the 404 inside the site chrome (PRD 7.9). */
export default function NotFound() {
  return (
    <SiteLayout params={Promise.resolve({})}>
      <NotFoundBody />
    </SiteLayout>
  );
}
