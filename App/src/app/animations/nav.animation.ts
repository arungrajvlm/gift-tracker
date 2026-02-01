import { Animation, createAnimation } from '@ionic/angular';

export const fancyAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
    const enteringAnimation = createAnimation()
        .addElement(opts.enteringEl)
        .fromTo('opacity', 0, 1)
        .fromTo('transform', 'scale(0.95)', 'scale(1)')
        .easing('cubic-bezier(0.32, 0.72, 0, 1)')
        .duration(400);

    const leavingAnimation = createAnimation()
        .addElement(opts.leavingEl)
        .fromTo('opacity', 1, 0)
        .easing('ease-out')
        .duration(300);

    const animation = createAnimation()
        .addAnimation(enteringAnimation)
        .addAnimation(leavingAnimation);

    return animation;
};
