import { BreweryCard } from "#root/shared/ui";
import { useUnit } from "effector-react";
import {
  breweryPage,
  breweriesFeatureStarted,
  $list,
  $currentBrewery,
} from "#root/features/breweries";
import { sleep } from "#root/shared/lib/sleep";

import { allSettled, fork, serialize } from "effector";
import { useRouter } from "next/router";

export const getStaticPaths = async () => {
  const scope = fork();

  await allSettled(breweriesFeatureStarted, { scope });

  const list = scope.getState($list);

  return {
    paths: list
      .map((brewery) => ({ params: { id: brewery.id } }))
      /**
       * Generate only first 3 pages,
       * so deploy of the app will be faster
       *
       * In real world you should generate pages based on some criteria that is relevant to your product
       */
      .slice(0, 3),
    fallback: true,
  };
};

export const getStaticProps = async ({
  params,
}: {
  params: { id: string };
}) => {
  const scope = fork();

  await allSettled(breweryPage.open, { scope, params });

  const values = serialize(scope);

  /**
   * Force a delay to show the "fallback" loading state
   */
  await sleep(1000);

  return {
    props: {
      values,
    },
  };
};

export default function Page() {
  const brewery = useUnit($currentBrewery);
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <div>loading...</div>
        <div>(This is a `router.isFallback` state)</div>
      </div>
    );
  }

  if (!brewery) {
    return <div>not found</div>;
  }

  return (
    <section>
      <h1>{brewery.name}</h1>
      <BreweryCard {...brewery} />
    </section>
  );
}
