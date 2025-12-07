import { Args } from "grimoire-kolmafia";
import {
  Item,
  buy,
  mallPrice,
  print,
  printHtml,
  retrievePrice,
  toString,
  use,
  userNotify,
} from "kolmafia";
import { $items, $skill, get, have } from "libram";

import { args } from "./lib/args";

export function main(command: string): void {
  userNotify("");
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  // Filter item list to only items that:
  //    grant skills that the player doesn't have,
  //    that they can use,
  //    that are permable.
  var skillGranters: Item[] = $items``.filter(
    (item) => item.skill !== $skill`none` && !have(item.skill) && item.skill.permable
  );

  if (args.buy) {
    if (args.buyLimit <= 0) {
      print("Your buyLimit is set to 0, please set a real value and try again", "red");
      return;
    }

    buyItems(skillGranters);
  }

  // Get just the list of items they have available
  var haveItems: Item[] = skillGranters.filter((item) => have(item));

  if (args.use) {
    useReusable(haveItems);
    return;
  }

  if (args.useKarma) {
    useReusableKarma(haveItems);
    return;
  }

  if (args.useAll) {
    print(
      `Found ${haveItems.length} skill-granting items in your inventory that you haven't used...`,
      "green"
    );
    useAll(haveItems);
    return;
  }

  if (args.useAllKarma) {
    useAllKarma(haveItems);
    return;
  }

  if (!args.buy) {
    print(
      `Found ${haveItems.length} skill-granting items in your inventory that you haven't used...`,
      "green"
    );
    const output = [
      `<table border="2" cols="3"><tr><th>Item</th><th>Skill</th><th>Mall Price</th></tr>`,
    ];

    haveItems.forEach((item) => {
      output.push(
        "<tr>" +
          `<td><p>${item}</p></td>` +
          `<td><p>${item.skill}</p></td>` +
          `<td><p>${toString(retrievePrice(item), "%,d")}</p></td>` +
          "</tr>"
      );
    });

    output.push(`</table>`);
    printHtml(output.join(""));
  }
}

function buyItems(items: Item[]) {
  var dontHave = items.filter((item) => !have(item));
  var totalPrice = 0;
  var skillCount = 0;
  dontHave.forEach((item) => {
    var itemPrice = mallPrice(item);
    if (itemPrice > 0 && itemPrice < args.buyLimit) {
      totalPrice += itemPrice;
      skillCount++;
      if (args.sim) {
        print(`Sim: Buying 1 ${item} at ${itemPrice}`);
      } else {
        buy(1, item, args.buyLimit);
      }
    }
  });

  if (args.sim) {
    print(`You'd spend ${totalPrice} meat to get ${skillCount} new skill-granting items.`, "green");
  }
}

function useReusable(inv: Item[]) {
  var reusable = inv.filter((item) => item.reusable);

  print(
    `Found ${reusable.length} reusable skill-granting items in your inventory that you haven't used...`,
    "green"
  );
  useAll(reusable);
}

function useReusableKarma(inv: Item[]) {
  var bankedKarma = get("bankedKarma");
  const limit = Math.floor(bankedKarma / 100);

  var permable = inv.filter((item) => item.reusable).slice(0, limit);

  print(
    `Found ${permable.length} reusable skill-granting items in your inventory that you haven't used and have the karma to softcore perm...`,
    "green"
  );
  useAll(permable);
}

function useAllKarma(inv: Item[]) {
  var bankedKarma = get("bankedKarma");
  const limit = Math.floor(bankedKarma / 100);

  var permable = inv.slice(0, limit);

  print(
    `Found ${permable.length} skill-granting items in your inventory that you haven't used and have the karma to softcore perm...`,
    "green"
  );
  useAll(permable);
}

function useAll(inv: Item[]) {
  inv.forEach((item) => {
    if (args.sim) {
      simUsage(item);
    } else {
      realUsage(item);
    }
  });
}

function simUsage(item: Item): void {
  const price = retrievePrice(item);
  if (args.useLimit > 0 && price > args.useLimit) {
    print(
      `Sim: Skipping ${item} because it's too expensive. (${toString(price, "%,d")} meat)`,
      "orange"
    );
  } else {
    print(`Sim: Using 1 ${item}.`);
  }
}

function realUsage(item: Item): void {
  const price = retrievePrice(item);
  if (args.useLimit > 0 && price > args.useLimit) {
    print(
      `Skipping ${item} because it's too expensive. (${toString(price, "%,d")} meat)`,
      "orange"
    );
  } else {
    use(1, item);
  }
}
