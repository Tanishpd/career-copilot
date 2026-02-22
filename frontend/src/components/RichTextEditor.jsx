import React, { useRef, useEffect, useState } from 'react';

export const RichTextEditor = ({ value, onChange, placeholder, className }) => {
    const contentEditableRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initial render
    useEffect(() => {
        if (contentEditableRef.current && value && contentEditableRef.current.innerHTML !== value) {
            // Only update if significantly different to avoid cursor jumps
            // Ideally we only set this once on mount or if external change forces it
            if (!isFocused) {
                contentEditableRef.current.innerHTML = value;
            }
        }
    }, [value, isFocused]);

    const handleInput = (e) => {
        const html = e.currentTarget.innerHTML;
        onChange(html);
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        contentEditableRef.current.focus();
    };

    return (
        <div className={`rich-text-editor border rounded overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="toolbar bg-gray-50 border-b p-xs flex gap-xs items-center select-none">
                <button
                    className="p-1 hover:bg-gray-200 rounded font-bold w-6 text-center text-sm"
                    onClick={() => execCommand('bold')}
                    title="Bold"
                    type="button"
                >
                    B
                </button>
                <button
                    className="p-1 hover:bg-gray-200 rounded italic w-6 text-center text-sm"
                    onClick={() => execCommand('italic')}
                    title="Italic"
                    type="button"
                >
                    I
                </button>
                <button
                    className="p-1 hover:bg-gray-200 rounded underline w-6 text-center text-sm"
                    onClick={() => execCommand('underline')}
                    title="Underline"
                    type="button"
                >
                    U
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                    className="p-1 hover:bg-gray-200 rounded text-sm px-2"
                    onClick={() => execCommand('insertUnorderedList')}
                    title="Bullet List"
                    type="button"
                >
                    • List
                </button>
                <button
                    className="p-1 hover:bg-gray-200 rounded text-sm px-2"
                    onClick={() => execCommand('removeFormat')}
                    title="Clear Formatting"
                    type="button"
                >
                    Clean
                </button>
            </div>

            {/* Editable Area */}
            <div
                ref={contentEditableRef}
                className="editor-content p-sm min-h-[100px] outline-none overflow-auto"
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                style={{ minHeight: '80px', maxHeight: '300px' }}
                dangerouslySetInnerHTML={{ __html: value }}
            />

            <style>{`
                .editor-content ul { list-style-type: disc; margin-left: 20px; }
                .editor-content ol { list-style-type: decimal; margin-left: 20px; }
                .editor-content b, .editor-content strong { font-weight: bold; }
                .editor-content i, .editor-content em { font-style: italic; }
            `}</style>
        </div>
    );
};
