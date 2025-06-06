import React, { useEffect, useState } from "react";
import { useSequentialRenderer } from "../hooks/useSequentialRenderer";

type AttachmentPropsType = {
    children: React.ReactNode,
    done: () => void,
}
export const Attachment = (props: AttachmentPropsType) => {
    const { children, done } = props
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const delay = Math.random() * 3000;

        const timer = setTimeout(() => {
            setLoaded(true);
            const i = done();
            console.log("happening multiple times", i, new Date());
        }, delay);

        return () => clearTimeout(timer);
    }, [done]);

    return <div>{loaded ? children : "loading"}</div>;
};
export type AttachmentsPropsType = {
    children: React.ReactNode[]
}
export const Attachments = (props: AttachmentsPropsType) => {
    const { children } = props
    const { items } = useSequentialRenderer(children as unknown as Record<string, React.ReactNode>[]);

    return (
        <>
            {items.map((attachment: any) => {
                return (
                    <Attachment done={() => attachment.done()}>
                        {attachment.text}
                    </Attachment>
                )
            })}
        </>
    )
}
