---
description: See what happens to the numbers if an assumption changes
argument-hint: <case file> <changes, e.g. captureRate=20 engineers=800>
---

Answer a what-if on a business case without changing the real case file. Use the **business-case** skill.

Arguments: $ARGUMENTS

1. Run `calc --md` on the case file and keep the result as the baseline.
2. Copy the case file to a temporary file, apply the requested changes to the **copy** with `set`, and run `calc --md` on the copy.
3. Show a short before and after for annual value, net year one, payback and return, and say which driver moved most.
4. Delete the copy. Only change the real file if the user then asks you to.

Remember that an input stays an assumption unless the customer confirmed it; say whether the changed value is the customer's number or a scenario.
