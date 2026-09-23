---
title: Move Authenticator to a New iPhone Without Losing Access
slug: transfer-authenticator-new-iphone
description: Transfer Google and Microsoft Authenticator to a new iPhone. Learn what syncs, what needs sign-in again and what to test before trading in.
publishDate: 2026-09-14
updatedDate: ''
author: App-Tipps Editorial
category: App Tips
categories:
  - App Tips
tags:
  - iPhone
  - Account Security
  - Authenticator
featuredImage: /images/2026/09/transfer-authenticator-new-iphone.svg
featuredImageAlt: 'Authenticator migration checklist: Google sync or export, Microsoft restore and verification, then test access'
rating: null
correctionNote: ''
seoTitle: ''
canonicalUrl: ''
noindex: false
draft: false
relatedSlugs:
  - new-iphone-not-enough-icloud-storage
  - quick-share-android-iphone-airdrop-guide
---

**Check your authenticator separately before erasing or trading in your old phone.** A restored account name is not always a working sign-in method.

This guide covers Google Authenticator and Microsoft Authenticator. The first decision is which app stores your codes; the second is whether you still have the old device.

## Choose the matching situation

| Situation | Next step |
| --- | --- |
| Google Authenticator with account sync | Use the same Google Account on the new phone |
| Google Authenticator with local-only codes | Export from the old device and import on the new one |
| Microsoft Authenticator, iPhone to iPhone | Check backup, restore, then finish account verification |
| Microsoft Authenticator, Android to iPhone | Re-register accounts; the backup cannot cross platforms |
| Old phone unavailable, no usable backup | Use each account provider's recovery process |

These routes come from [Google's transfer instructions](https://support.google.com/accounts/answer/1066447?hl=en&co=GENIE.Platform%3DiOS) and [Microsoft's restore guidance](https://support.microsoft.com/en-us/authenticator/restore-account-credentials-from-microsoft-authenticator).

## Google Authenticator: sync or export

If the old app saves codes to a Google Account, sign into that same account inside Authenticator on the new iPhone. Check the selected profile if entries are missing.

For <a rel="sponsored" href="https://kinsta.com/wordpress-hosting/migration/?kaid=EKCQYUYKKROE">Kinsta</a> [codes](https://kinsta.com/wordpress-hosting/migration/?kaid=EKCQYUYKKROE) kept without account sync:

1. On the old device, open Authenticator's menu.
2. Choose **Transfer accounts → Export accounts**, unlock the device and select the entries.
3. On the new phone, choose **Transfer accounts → Import accounts**.
4. Scan the export QR code. There may be several.

Keep the QR codes private: they carry the information needed to reproduce those verification codes.

Do not delete synced entries from the old app to clean it up. Google says deletion also removes them from other synced devices.

## Microsoft Authenticator: check the account type

[Microsoft's migration documentation](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-transfer-authenticator-new-phone) calls for iCloud Drive, Keychain and backup to be enabled on iOS, including Authenticator under the apps saved to iCloud.

Restoring the app is followed by an account check:

| Account type | What to expect |
| --- | --- |
| Third-party accounts using rotating codes | Supported code entries can restore |
| Personal Microsoft account using only rotating codes | Code entry can restore |
| Microsoft passwordless sign-in | Sign in again to finish setup |
| Work or school account | The name restores; further sign-in/setup is required |

For work access, open the restored entry and complete its prompts. If your organisation requires registration that you cannot perform yourself, use its help desk.

Passkeys need separate attention. A credential saved only on the old phone needs a replacement; a synced credential may be available through its credential manager. Test before removing the old method.

## What if Microsoft restore does not appear?

Follow [Microsoft's restore page](https://support.microsoft.com/en-us/authenticator/restore-account-credentials-from-microsoft-authenticator) for your platform and app screen. iOS recovery depends on iCloud; use the same relevant accounts and complete any additional verification shown.

Microsoft limits backup restoration to the same device type. An Android backup is not an iPhone migration route. Keep Android available to authorise re-registration where possible.

Avoid repeatedly removing accounts just to make the screen look right. First establish which backup exists and which account it belongs to.

## A useful test before you erase anything

Our suggested check is one real sign-in per important account, using the new phone when verification is requested. Keep an existing signed-in session available during the test.

Make a short list: main email, work account and any service you cannot easily recover. Mark each one only after its new-phone method succeeds. A familiar list of account names is not the test.

If the old phone is already gone and recovery fails, use the service's backup codes, alternative verification or official account recovery. Restoring an unrelated phone backup is not evidence that a missing authenticator entry can be recovered.

For the rest of the move, see [new-iPhone transfer options when iCloud is full](/new-iphone-not-enough-icloud-storage/).

_Based on official Google and Microsoft documentation checked on September 14, 2026. Menu wording can vary by app version. No new-iPhone hardware testing is claimed._
