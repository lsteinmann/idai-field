/**
 * @author Thomas Kleinke
 */
export module AngularUtility {

    export async function refresh(duration: number = 1) {

        await new Promise(resolve => setTimeout(async () => resolve(undefined), duration));
    }


    export function focusElementInNgTemplate(id: string) {

        const element: HTMLElement = document.getElementById(id);
        if (element) element.focus();
    }
}
