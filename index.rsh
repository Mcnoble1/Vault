'reach 0.1';

const COUNTDOWN = 10;

const Shared = {
  ...hasRandom,
  showTime: Fun([UInt], Null),
  informTimeout: Fun([], Null),
}

export const main = Reach.App(() => {
  const A = Participant('Alice', {
    // Specify Alice's interact interface here
    ...Shared,
    inherit: Fun([], UInt),
    getChoice: Fun([], Bool),
    deadline: UInt,
  });
  const B = Participant('Bob', {
    // Specify Bob's interact interface here
    ...Shared,
    acceptTerms: Fun([UInt], Bool),
  });

  init();
  // The first one to publish deploys the contract
  A.only(() => {
    const value = declassify(interact.inherit()) // Alice's inherit token value from frontend
    const deadline = declassify(interact.deadline) // Alice's deadline from frontend
  })
  A.publish(value, deadline) // Alice's publish her inherit token value to the contract
     .pay(value) // Alice pays the value into the contract
    .timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout))
  commit();
  // The second one to publish always attaches
  B.only(() => {
    const terms = declassify(interact.acceptTerms(value));
  })
  B.publish(terms)
  .timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout))
  commit();

  const informTimeout = () => {
    each([Alice, Bob], () => {
        interact.informTimeout()
    });
  };

  const showTime = () => {
      each([A, B], () => {
        interact.showTime(COUNTDOWN);
      })
    }
  

  A.only(() => {
    const stillHere = declassify(interact.getChoice());
  })
  A.publish(stillHere)
  .timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout))

  var end = lastConsensusTime() + COUNTDOWN;
  invariant(balance() == value && stillHere === true);
  while (lastConsensusTime() < end) {
    if(stillHere) {
      transfer(value).to(A);
    } else {
      transfer(value).to(B);
    }
    continue
  }
 
  // write your program here
  commit();
  exit();
});
