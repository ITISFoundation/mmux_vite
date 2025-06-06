import React, { useEffect, useState } from "react";

type plotsObjectType = {
    loaded: boolean;
    plot: React.ReactNode;
}
const plotsObject = [1, 2, 3, 4].map((a: React.ReactNode) => ({
    loaded: false,
    plot: a
}));

type AttachmentPropsType = {
    children: React.ReactNode,
    done: () => void,
}
const Attachment = (props: AttachmentPropsType) => {
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
type AttachmentsPropsType = {
    children: React.ReactNode[]
}
// const Attachments = (props: AttachmentsPropsType) => {
//     const { children } = props
//     const { items } = useSequentialRenderer(children);

//     return (
//         {items.map((attachment, i) => {
//             return (
//                 <Attachment done={() => attachment.done()}>
//                 {attachment.text}
//                 </Attachment>
//             )
//         })})}


// const Attachments = (props) => {
//     const { items } = useSequentialRenderer(props.children);

//     return (
//         <>
//             {items.map((attachment, i) => {
//                 return (
//                     <Attachment done={() => attachment.done()}>
//                         {attachment.text}
//                     </Attachment>
//                 );
//             })}
//         </>
//     );
// };