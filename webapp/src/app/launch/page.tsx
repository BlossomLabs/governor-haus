'use client'
import { useWriteContract, useAccount, usePublicClient } from "wagmi"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import ClaimNameCard from "../../components/form/ClaimNameCard"
import { useCreateDaoForm } from "../../utils/form"
import TokenParametersCard from "@/components/form/TokenParametersCard"
import VotingParametersCard from "@/components/form/VotingParametersCard"
import { optimism } from "viem/chains"
import { useToast } from "@/components/ui/use-toast"
import type { FormValues } from "@/utils/form"
import { useSignInWithTally, createTallyDao } from "@/utils/tally-api"
import { processTx, getContractAddress, _login, sendCreateDaoTx } from "@/utils/dao"
import { PublicClient } from "viem"
import { loginErrorToast, processTxErrorToast, sendCreateDaoTxErrorToast, walletNotConnectedToast, wrongNetworkToast } from "./toasts"
import { useState, useEffect } from 'react'

function LaunchPage() {
    const { writeContract } = useWriteContract()
    const { signIn } = useSignInWithTally()
    const form = useCreateDaoForm()
    const { address, chain } = useAccount()
    const { toast } = useToast()
    const publicClient = usePublicClient() as PublicClient
    const explorerUrl = chain?.id === optimism.id ? "https://optimism.blockscout.com" : "https://explorer.celo.org"
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

    async function onSubmit(values: FormValues) {
        console.log(values);
        if (!address || !chain) {
            walletNotConnectedToast(toast)
            return
        }
        const contractAddress = getContractAddress(chain)
        if (!contractAddress) {
            wrongNetworkToast(toast)
            return
        }
        const login = await _login(signIn)
        if (!login) {
            loginErrorToast(toast)
            return
        }
        let res
        try {
            res = await sendCreateDaoTx(writeContract, contractAddress, values)
        } catch (error) {
            console.error(error)
            sendCreateDaoTxErrorToast(toast)
            return
        }

        const result = await processTx(res, publicClient)
        if (!result) {
            processTxErrorToast(toast)
            return;
        }
        const { tokenAddress, governorAddress, blockNumber } = result;
        toast({
            title: "DAO created",
            description: <ul>
                <li>Your Token has been created at <a className="underline font-bold" target="_blank" href={`${explorerUrl}/token/${tokenAddress}`}>{tokenAddress}</a></li>
                <li>Your DAO has been created at <a className="underline font-bold" target="_blank" href={`${explorerUrl}/address/${governorAddress}`}>{governorAddress}</a></li>
            </ul>,
            variant: "default"
        });
        const url = await createTallyDao(values.governor.name, tokenAddress, governorAddress, chain.id, blockNumber, login)
        setRedirectUrl(url)
    }

    useEffect(() => {
        if (redirectUrl) {
            window.open(redirectUrl, "_blank")
        }
    }, [redirectUrl])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="py-10">
                <div className="hidden">{JSON.stringify(form.formState.errors)}</div> {/* FIXME: If this is removed, the form will not re-render the errors */}
                <div className="max-w-xl mx-auto">
                    <div className="px-3">
                        <h2 className="font-header text-3xl font-bold mb-2">Create your organization</h2>
                        <p className="text-gray-700 mb-6">
                            This form creates an OpenZeppelin Token and Governor, and registers the DAO on Tally for easy management.
                        </p>
                    </div>
                    <ClaimNameCard form={form} />
                    <TokenParametersCard form={form} />
                    <VotingParametersCard form={form} />
                    <div className="flex justify-center">
                        <Button type="submit" className="py-3 px-6 rounded-md w-full md:w-auto" size="xl">
                            Create DAO
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}

export default LaunchPage